using System;
using Kyoo.Models;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models.Attributes;
using Kyoo.Models.Exceptions;
using Microsoft.Extensions.DependencyInjection;

namespace Kyoo.Tasks
{
	public class Crawler : ITask
	{
		public string Slug => "scan";
		public string Name => "Scan libraries";
		public string Description => "Scan your libraries, load data for new shows and remove shows that don't exist anymore.";
		public string HelpMessage => "Reloading all libraries is a long process and may take up to 24 hours if it is the first scan in a while.";
		public bool RunOnStartup => true;
		public int Priority => 0;
		
		[Injected] public IServiceProvider ServiceProvider { private get; set; }
		[Injected] public IThumbnailsManager ThumbnailsManager { private get; set; }
		[Injected] public IProviderManager MetadataProvider { private get; set; }
		[Injected] public ITranscoder Transcoder { private get; set; }
		[Injected] public IConfiguration Config { private get; set; }

		private int _parallelTasks;
		
		public TaskParameters GetParameters()
		{
			return new()
			{
				TaskParameter.Create<string>("slug", "A library slug to restrict the scan to this library.")
			};
		}

		public int? Progress()
		{
			// TODO implement this later.
			return null;
		}
		
		public async Task Run(TaskParameters parameters,
			CancellationToken cancellationToken)
		{
			string argument = parameters["slug"].As<string>();
			
			_parallelTasks = Config.GetValue<int>("parallelTasks");
			if (_parallelTasks <= 0)
				_parallelTasks = 30;

			using IServiceScope serviceScope = ServiceProvider.CreateScope();
			ILibraryManager libraryManager = serviceScope.ServiceProvider.GetService<ILibraryManager>();
			
			foreach (Show show in await libraryManager!.GetAll<Show>())
				if (!Directory.Exists(show.Path))
					await libraryManager.Delete(show);
			
			ICollection<Episode> episodes = await libraryManager.GetAll<Episode>();
			foreach (Episode episode in episodes)
				if (!File.Exists(episode.Path))
					await libraryManager.Delete(episode);
			
			ICollection<Track> tracks = await libraryManager.GetAll<Track>();
			foreach (Track track in tracks)
				if (!File.Exists(track.Path))
					await libraryManager.Delete(track);

			ICollection<Library> libraries = argument == null 
				? await libraryManager.GetAll<Library>()
				: new [] { await libraryManager.Get<Library>(argument)};
			
			if (argument != null && libraries.First() == null)
				throw new ArgumentException($"No library found with the name {argument}");
			
			foreach (Library library in libraries)
				await libraryManager.Load(library, x => x.Providers);
			
			foreach (Library library in libraries)
				await Scan(library, episodes, tracks, cancellationToken);
			Console.WriteLine("Scan finished!");
		}

		private async Task Scan(Library library, IEnumerable<Episode> episodes, IEnumerable<Track> tracks, CancellationToken cancellationToken)
		{
			Console.WriteLine($"Scanning library {library.Name} at {string.Join(", ", library.Paths)}.");
			foreach (string path in library.Paths)
			{
				if (cancellationToken.IsCancellationRequested)
					continue;
				
				string[] files;
				try
				{
					files = Directory.GetFiles(path, "*", SearchOption.AllDirectories);
				}
				catch (DirectoryNotFoundException)
				{
					await Console.Error.WriteLineAsync($"The library's directory {path} could not be found (library slug: {library.Slug})");
					continue;
				}
				catch (PathTooLongException)
				{
					await Console.Error.WriteLineAsync($"The library's directory {path} is too long for this system. (library slug: {library.Slug})");
					continue;
				}
				catch (ArgumentException)
				{
					await Console.Error.WriteLineAsync($"The library's directory {path} is invalid. (library slug: {library.Slug})");
					continue;
				}
				catch (UnauthorizedAccessException ex)
				{
					await Console.Error.WriteLineAsync($"{ex.Message} (library slug: {library.Slug})");
					continue;
				}

				List<IGrouping<string, string>> shows =  files
					.Where(x => IsVideo(x) && episodes.All(y => y.Path != x))
					.GroupBy(Path.GetDirectoryName)
					.ToList();

				// TODO If the library's path end with a /, the regex is broken.
				IEnumerable<string> tasks = shows.Select(x => x.First());
				foreach (string[] showTasks in tasks.BatchBy(_parallelTasks))
					await Task.WhenAll(showTasks
						.Select(x => RegisterFile(x, x.Substring(path.Length), library, cancellationToken)));

				tasks = shows.SelectMany(x => x.Skip(1));
				foreach (string[] episodeTasks in tasks.BatchBy(_parallelTasks * 2))
					await Task.WhenAll(episodeTasks
						.Select(x => RegisterFile(x, x.Substring(path.Length), library, cancellationToken)));
				
				await Task.WhenAll(files.Where(x => IsSubtitle(x) && tracks.All(y => y.Path != x))
					.Select(x => RegisterExternalSubtitle(x, cancellationToken)));
			}
		}

		private async Task RegisterExternalSubtitle(string path, CancellationToken token)
		{
			try
			{
				if (token.IsCancellationRequested || path.Split(Path.DirectorySeparatorChar).Contains("Subtitles"))
					return;
				using IServiceScope serviceScope = ServiceProvider.CreateScope();
				ILibraryManager libraryManager = serviceScope.ServiceProvider.GetService<ILibraryManager>();

				string patern = Config.GetValue<string>("subtitleRegex");
				Regex regex = new(patern, RegexOptions.IgnoreCase);
				Match match = regex.Match(path);

				if (!match.Success)
				{
					await Console.Error.WriteLineAsync($"The subtitle at {path} does not match the subtitle's regex.");
					return;
				}

				string episodePath = match.Groups["Episode"].Value;
				Episode episode = await libraryManager!.Get<Episode>(x => x.Path.StartsWith(episodePath));
				Track track = new()
				{
					Type = StreamType.Subtitle,
					Language = match.Groups["Language"].Value,
					IsDefault = match.Groups["Default"].Value.Length > 0, 
					IsForced = match.Groups["Forced"].Value.Length > 0,
					Codec = SubtitleExtensions[Path.GetExtension(path)],
					IsExternal = true,
					Path = path,
					Episode = episode
				};

				await libraryManager.Create(track);
				Console.WriteLine($"Registering subtitle at: {path}.");
			}
			catch (ItemNotFound)
			{
				await Console.Error.WriteLineAsync($"No episode found for subtitle at: ${path}.");
			}
			catch (Exception ex)
			{
				await Console.Error.WriteLineAsync($"Unknown error while registering subtitle: {ex.Message}");
			}
		}

		private async Task RegisterFile(string path, string relativePath, Library library, CancellationToken token)
		{
			if (token.IsCancellationRequested)
				return;

			try
			{
				using IServiceScope serviceScope = ServiceProvider.CreateScope();
				ILibraryManager libraryManager = serviceScope.ServiceProvider.GetService<ILibraryManager>();

				string patern = Config.GetValue<string>("regex");
				Regex regex = new(patern, RegexOptions.IgnoreCase);
				Match match = regex.Match(relativePath);

				if (!match.Success)
				{
					await Console.Error.WriteLineAsync($"The episode at {path} does not match the episode's regex.");
					return;
				}
				
				string showPath = Path.GetDirectoryName(path);
				string collectionName = match.Groups["Collection"].Value;
				string showName = match.Groups["Show"].Value;
				int seasonNumber = int.TryParse(match.Groups["Season"].Value, out int tmp) ? tmp : -1;
				int episodeNumber = int.TryParse(match.Groups["Episode"].Value, out tmp) ? tmp : -1;
				int absoluteNumber = int.TryParse(match.Groups["Absolute"].Value, out tmp) ? tmp : -1;

				Collection collection = await GetCollection(libraryManager, collectionName, library);
				bool isMovie = seasonNumber == -1 && episodeNumber == -1 && absoluteNumber == -1;
				Show show = await GetShow(libraryManager, showName, showPath, isMovie, library);
				if (isMovie)
					await libraryManager!.Create(await GetMovie(show, path));
				else
				{
					Season season = await GetSeason(libraryManager, show, seasonNumber, library);
					Episode episode = await GetEpisode(libraryManager,
						show,
						season,
						episodeNumber,
						absoluteNumber,
						path,
						library);
					await libraryManager!.Create(episode);
				}

				await libraryManager.AddShowLink(show, library, collection);
				Console.WriteLine($"Episode at {path} registered.");
			}
			catch (DuplicatedItemException ex)
			{
				await Console.Error.WriteLineAsync($"{path}: {ex.Message}");
			}
			catch (Exception ex)
			{
				await Console.Error.WriteLineAsync($"Unknown exception thrown while registering episode at {path}." +
				                                   $"\nException: {ex.Message}" +
				                                   $"\n{ex.StackTrace}");
			}
		}

		private async Task<Collection> GetCollection(ILibraryManager libraryManager, 
			string collectionName, 
			Library library)
		{
			if (string.IsNullOrEmpty(collectionName))
				return null;
			Collection collection = await libraryManager.Get<Collection>(Utility.ToSlug(collectionName));
			if (collection != null)
				return collection;
			collection = await MetadataProvider.GetCollectionFromName(collectionName, library);

			try
			{
				await libraryManager.Create(collection);
				return collection;
			}
			catch (DuplicatedItemException)
			{
				return await libraryManager.Get<Collection>(collection.Slug);
			}
		}
		
		private async Task<Show> GetShow(ILibraryManager libraryManager, 
			string showTitle, 
			string showPath,
			bool isMovie, 
			Library library)
		{
			Show old = await libraryManager.Get<Show>(x => x.Path == showPath);
			if (old != null)
			{
				await libraryManager.Load(old, x => x.ExternalIDs);
				return old;
			}
			Show show = await MetadataProvider.SearchShow(showTitle, isMovie, library);
			show.Path = showPath;
			show.People = await MetadataProvider.GetPeople(show, library);

			try
			{
				show = await libraryManager.Create(show);
			}
			catch (DuplicatedItemException)
			{
				old = await libraryManager.Get<Show>(show.Slug);
				if (old.Path == showPath)
				{
					await libraryManager.Load(old, x => x.ExternalIDs);
					return old;
				}
				show.Slug += $"-{show.StartYear}";
				await libraryManager.Create(show);
			}
			await ThumbnailsManager.Validate(show);
			return show;
		}

		private async Task<Season> GetSeason(ILibraryManager libraryManager, 
			Show show, 
			int seasonNumber, 
			Library library)
		{
			if (seasonNumber == -1)
				return default;
			try
			{
				Season season = await libraryManager.Get(show.Slug, seasonNumber);
				season.Show = show;
				return season;
			}
			catch (ItemNotFound)
			{
				Season season = await MetadataProvider.GetSeason(show, seasonNumber, library);
				await libraryManager.CreateIfNotExists(season);
				await ThumbnailsManager.Validate(season);
				season.Show = show;
				return season;
			}
		}
		
		private async Task<Episode> GetEpisode(ILibraryManager libraryManager, 
			Show show, 
			Season season,
			int episodeNumber,
			int absoluteNumber, 
			string episodePath, 
			Library library)
		{
			Episode episode = await MetadataProvider.GetEpisode(show,
				episodePath, 
				season?.SeasonNumber ?? -1, 
				episodeNumber,
				absoluteNumber,
				library);
			
			season ??= await GetSeason(libraryManager, show, episode.SeasonNumber, library);
			episode.Season = season;
			episode.SeasonID = season?.ID;
			await ThumbnailsManager.Validate(episode);
			await GetTracks(episode);
			return episode;
		}

		private async Task<Episode> GetMovie(Show show, string episodePath)
		{
			Episode episode = new()
			{
				Title = show.Title,
				Path = episodePath,
				Show = show,
				ShowID = show.ID,
				ShowSlug = show.Slug
			};
			episode.Tracks = await GetTracks(episode);
			return episode;
		}

		private async Task<ICollection<Track>> GetTracks(Episode episode)
		{
			episode.Tracks = (await Transcoder.ExtractInfos(episode, false))
				.Where(x => x.Type != StreamType.Attachment)
				.ToArray();
			return episode.Tracks;
		}

		private static readonly string[] VideoExtensions =
		{
			".webm",
			".mkv",
			".flv",
			".vob",
			".ogg", 
			".ogv",
			".avi",
			".mts",
			".m2ts",
			".ts",
			".mov",
			".qt",
			".asf", 
			".mp4",
			".m4p",
			".m4v",
			".mpg",
			".mp2",
			".mpeg",
			".mpe",
			".mpv",
			".m2v",
			".3gp",
			".3g2"
		};

		private static bool IsVideo(string filePath)
		{
			return VideoExtensions.Contains(Path.GetExtension(filePath));
		}

		private static readonly Dictionary<string, string> SubtitleExtensions = new()
		{
			{".ass", "ass"},
			{".str", "subrip"}
		};

		private static bool IsSubtitle(string filePath)
		{
			return SubtitleExtensions.ContainsKey(Path.GetExtension(filePath));
		}
	}
}
