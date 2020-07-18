using System;
using Kyoo.Models;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Kyoo.Models.Exceptions;
using Kyoo.Models.Watch;
using Microsoft.Extensions.DependencyInjection;

namespace Kyoo.Controllers
{
	public class Crawler : ITask
	{
		public string Slug => "scan";
		public string Name => "Scan libraries";
		public string Description => "Scan your libraries, load data for new shows and remove shows that don't exist anymore.";
		public string HelpMessage => "Reloading all libraries is a long process and may take up to 24 hours if it is the first scan in a while.";
		public bool RunOnStartup => true;
		public int Priority => 0;
		
		private IServiceProvider _serviceProvider;
		private IThumbnailsManager _thumbnailsManager;
		private IProviderManager _metadataProvider;
		private ITranscoder _transcoder;
		private IConfiguration _config;

		private int _parallelTasks;
		
		public async Task<IEnumerable<string>> GetPossibleParameters()
		{
			using IServiceScope serviceScope = _serviceProvider.CreateScope();
			await using ILibraryManager libraryManager = serviceScope.ServiceProvider.GetService<ILibraryManager>();
			return (await libraryManager.GetLibraries()).Select(x => x.Slug);
		}

		public int? Progress()
		{
			// TODO implement this later.
			return null;
		}
		
		public async Task Run(IServiceProvider serviceProvider, 
			CancellationToken cancellationToken, 
			string argument = null)
		{
			_serviceProvider = serviceProvider;
			_thumbnailsManager = serviceProvider.GetService<IThumbnailsManager>();
			_metadataProvider = serviceProvider.GetService<IProviderManager>();
			_transcoder = serviceProvider.GetService<ITranscoder>();
			_config = serviceProvider.GetService<IConfiguration>();
			_parallelTasks = _config.GetValue<int>("parallelTasks");
			if (_parallelTasks <= 0)
				_parallelTasks = 30;

			using IServiceScope serviceScope = _serviceProvider.CreateScope();
			await using ILibraryManager libraryManager = serviceScope.ServiceProvider.GetService<ILibraryManager>();
			
			foreach (Show show in await libraryManager.GetShows())
				if (!Directory.Exists(show.Path))
					await libraryManager.DeleteShow(show);
			
			ICollection<Episode> episodes = await libraryManager.GetEpisodes();
			ICollection<Library> libraries = argument == null 
				? await libraryManager.GetLibraries()
				: new [] { await libraryManager.GetLibrary(argument)};

			foreach (Episode episode in episodes)
			{
				if (!File.Exists(episode.Path))
					await libraryManager.DeleteEpisode(episode);
			}

			// TODO replace this grotesque way to load the providers.
			foreach (Library library in libraries)
				library.Providers = library.Providers;
			
			foreach (Library library in libraries)
				await Scan(library, episodes, cancellationToken);
			Console.WriteLine("Scan finished!");
		}

		private async Task Scan(Library library, IEnumerable<Episode> episodes, CancellationToken cancellationToken)
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
				
				IEnumerable<Task> tasks = shows
					.Select(x => x.First())
					.Select(x => RegisterFile(x, x.Substring(path.Length), library, cancellationToken));
				foreach (Task[] showTasks in tasks.BatchBy(_parallelTasks))
					await Task.WhenAll(showTasks);

				tasks = shows
					.SelectMany(x => x.Skip(1))
					.Select(x => RegisterFile(x, x.Substring(path.Length), library, cancellationToken));
				foreach (Task[] episodeTasks in tasks.BatchBy(_parallelTasks * 2))
					await Task.WhenAll(episodeTasks);
			}
		}

		private async Task RegisterFile(string path, string relativePath, Library library, CancellationToken token)
		{
			if (token.IsCancellationRequested)
				return;

			try
			{
				using IServiceScope serviceScope = _serviceProvider.CreateScope();
				await using ILibraryManager libraryManager = serviceScope.ServiceProvider.GetService<ILibraryManager>();

				string patern = _config.GetValue<string>("regex");
				Regex regex = new Regex(patern, RegexOptions.IgnoreCase);
				Match match = regex.Match(relativePath);

				if (!match.Success)
				{
					await Console.Error.WriteLineAsync($"The episode at {path} does not match the episode's regex.");
					return;
				}
				
				string showPath = Path.GetDirectoryName(path);
				string collectionName = match.Groups["Collection"]?.Value;
				string showName = match.Groups["Show"].Value;
				int seasonNumber = int.TryParse(match.Groups["Season"].Value, out int tmp) ? tmp : -1;
				int episodeNumber = int.TryParse(match.Groups["Episode"].Value, out tmp) ? tmp : -1;
				int absoluteNumber = int.TryParse(match.Groups["Absolute"].Value, out tmp) ? tmp : -1;

				Collection collection = await GetCollection(libraryManager, collectionName, library);
				bool isMovie = seasonNumber == -1 && episodeNumber == -1 && absoluteNumber == -1;
				Show show = await GetShow(libraryManager, showName, showPath, isMovie, library);
				if (isMovie)
					await libraryManager.RegisterEpisode(await GetMovie(show, path));
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
					await libraryManager.RegisterEpisode(episode);
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
			Collection collection = await libraryManager.GetCollection(Utility.ToSlug(collectionName));
			if (collection != null)
				return collection;
			collection = await _metadataProvider.GetCollectionFromName(collectionName, library);

			try
			{
				await libraryManager.RegisterCollection(collection);
				return collection;
			}
			catch (DuplicatedItemException)
			{
				return await libraryManager.GetCollection(collection.Slug);
			}
		}
		
		private async Task<Show> GetShow(ILibraryManager libraryManager, 
			string showTitle, 
			string showPath,
			bool isMovie, 
			Library library)
		{
			Show show = (await libraryManager.GetShows(x => x.Path == showPath, limit: 1))
				.FirstOrDefault();
			if (show != null)
				return show;
			show = await _metadataProvider.SearchShow(showTitle, isMovie, library);
			show.Path = showPath;
			show.People = await _metadataProvider.GetPeople(show, library);

			try
			{
				await libraryManager.RegisterShow(show);
				await _thumbnailsManager.Validate(show.People);
				await _thumbnailsManager.Validate(show);
				return show;
			}
			catch (DuplicatedItemException)
			{
				return await libraryManager.GetShow(show.Slug);
			}
		}

		private async Task<Season> GetSeason(ILibraryManager libraryManager, 
			Show show, 
			int seasonNumber, 
			Library library)
		{
			if (seasonNumber == -1)
				return default;
			Season season = await libraryManager.GetSeason(show.Slug, seasonNumber);
			if (season == null)
			{
				season = await _metadataProvider.GetSeason(show, seasonNumber, library);
				try
				{
					await libraryManager.RegisterSeason(season);
					await _thumbnailsManager.Validate(season);
				}
				catch (DuplicatedItemException)
				{
					season = await libraryManager.GetSeason(show.Slug, season.SeasonNumber);
				}
			}
			season.Show = show;
			return season;
		}
		
		private async Task<Episode> GetEpisode(ILibraryManager libraryManager, 
			Show show, 
			Season season,
			int episodeNumber,
			int absoluteNumber, 
			string episodePath, 
			Library library)
		{
			Episode episode = await _metadataProvider.GetEpisode(show,
				episodePath, 
				season?.SeasonNumber ?? -1, 
				episodeNumber,
				absoluteNumber,
				library);
			
			season ??= await GetSeason(libraryManager, show, episode.SeasonNumber, library);
			episode.Season = season;
			episode.SeasonID = season?.ID;
			await _thumbnailsManager.Validate(episode);
			await GetTracks(episode);
			return episode;
		}

		private async Task<Episode> GetMovie(Show show, string episodePath)
		{
			Episode episode = new Episode
			{
				Title = show.Title,
				Path = episodePath,
				Show = show,
				ShowID = show.ID
			};
			episode.Tracks = await GetTracks(episode);
			return episode;
		}

		private async Task<IEnumerable<Track>> GetTracks(Episode episode)
		{
			IEnumerable<Track> tracks = await _transcoder.GetTrackInfo(episode.Path);
			List<Track> epTracks = tracks.Where(x => x.Type != StreamType.Subtitle).Concat(GetExtractedSubtitles(episode)).ToList();
			if (epTracks.Count(x => !x.IsExternal) < tracks.Count())
				epTracks.AddRange(await _transcoder.ExtractSubtitles(episode.Path));
			episode.Tracks = epTracks;
			return epTracks;
		}

		private static IEnumerable<Track> GetExtractedSubtitles(Episode episode)
		{
			List<Track> tracks = new List<Track>();
			
			if (episode.Path == null)
				return tracks;
			string path = Path.Combine(Path.GetDirectoryName(episode.Path)!, "Subtitles");
			
			if (!Directory.Exists(path)) 
				return tracks;
			foreach (string sub in Directory.EnumerateFiles(path, "", SearchOption.AllDirectories))
			{
				string episodeLink = Path.GetFileNameWithoutExtension(episode.Path);

				if (!sub.Contains(episodeLink!))
					continue;
				string language = sub.Substring(Path.GetDirectoryName(sub).Length + episodeLink.Length + 2, 3);
				bool isDefault = sub.Contains("default");
				bool isForced = sub.Contains("forced");
				Track track = new Track(StreamType.Subtitle, null, language, isDefault, isForced, null, false, sub) { EpisodeID = episode.ID };

				if (Path.GetExtension(sub) == ".ass")
					track.Codec = "ass";
				else if (Path.GetExtension(sub) == ".srt")
					track.Codec = "subrip";
				else
					track.Codec = null;
				tracks.Add(track);
			}
			return tracks;
		}

		private static readonly string[] VideoExtensions = { ".webm", ".mkv", ".flv", ".vob", ".ogg", ".ogv", ".avi", ".mts", ".m2ts", ".ts", ".mov", ".qt", ".asf", ".mp4", ".m4p", ".m4v", ".mpg", ".mp2", ".mpeg", ".mpe", ".mpv", ".m2v", ".3gp", ".3g2" };

		private static bool IsVideo(string filePath)
		{
			return VideoExtensions.Contains(Path.GetExtension(filePath));
		}
	}
}
