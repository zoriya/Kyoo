using System;
using Kyoo.Models;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
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
		
		private ILibraryManager _libraryManager;
		private IThumbnailsManager _thumbnailsManager;
		private IProviderManager _metadataProvider;
		private ITranscoder _transcoder;
		private IConfiguration _config;
		
		public IEnumerable<string> GetPossibleParameters()
		{
			return _libraryManager.GetLibraries().Select(x => x.Slug);
		}

		public int? Progress()
		{
			// TODO implement this later.
			return null;
		}
		
		public async Task Run(IServiceProvider serviceProvider, CancellationToken cancellationToken, string argument = null)
		{
			// TODO Should use more scopes of the library manager (one per episodes to register).
			using IServiceScope serviceScope = serviceProvider.CreateScope();
			_libraryManager = serviceScope.ServiceProvider.GetService<ILibraryManager>();
			_thumbnailsManager = serviceScope.ServiceProvider.GetService<IThumbnailsManager>();
			_metadataProvider = serviceScope.ServiceProvider.GetService<IProviderManager>();
			_transcoder = serviceScope.ServiceProvider.GetService<ITranscoder>();
			_config = serviceScope.ServiceProvider.GetService<IConfiguration>();

			try
			{
				IEnumerable<Episode> episodes = _libraryManager.GetEpisodes();
				IEnumerable<Library> libraries = argument == null 
					? _libraryManager.GetLibraries()
					: new [] {_libraryManager.GetLibrary(argument)};

				foreach (Episode episode in episodes)
				{
					if (!File.Exists(episode.Path))
						_libraryManager.RemoveEpisode(episode);
				}
				await _libraryManager.SaveChanges();
				
				foreach (Library library in libraries)
					await Scan(library, cancellationToken);
			}
			catch (Exception ex)
			{
				Console.Error.WriteLine($"Unknown exception thrown durring libraries scan.\nException: {ex.Message}");
			}
			Console.WriteLine("Scan finished!");
		}

		private async Task Scan(Library library, CancellationToken cancellationToken)
		{
			Console.WriteLine($"Scanning library {library.Name} at {string.Join(", ", library.Paths)}.");
			foreach (string path in library.Paths)
			{
				if (cancellationToken.IsCancellationRequested)
					return;
				
				await Task.WhenAll(Directory.GetFiles(path, "*", SearchOption.AllDirectories).Select(file =>
				{
					if (!IsVideo(file) || _libraryManager.GetEpisodes().Any(x => x.Path == file))
						return null;
					string relativePath = file.Substring(path.Length);
					return RegisterFile(file, relativePath, library, cancellationToken);
				}));
			}
		}

		private async Task RegisterFile(string path, string relativePath, Library library, CancellationToken token)
		{
			if (token.IsCancellationRequested)
				return;
			
			Console.WriteLine($"Registering episode at: {path}");
			string patern = _config.GetValue<string>("regex");
			Regex regex = new Regex(patern, RegexOptions.IgnoreCase);
			Match match = regex.Match(relativePath);

			string showPath = Path.GetDirectoryName(path);
			string collectionName = match.Groups["Collection"]?.Value;
			string showName = match.Groups["ShowTitle"].Value;
			long seasonNumber = long.TryParse(match.Groups["Season"].Value, out long tmp) ? tmp : -1;
			long episodeNumber = long.TryParse(match.Groups["Episode"].Value, out tmp) ? tmp : -1;
			long absoluteNumber = long.TryParse(match.Groups["Absolute"].Value, out tmp) ? tmp : -1;

			Collection collection = await GetCollection(collectionName, library);
			bool isMovie = seasonNumber == -1 && episodeNumber == -1 && absoluteNumber == -1;
			Show show = await GetShow(showName, showPath, isMovie, library);
			if (isMovie)
				_libraryManager.Register(await GetMovie(show, path));
			else
			{
				Season season = await GetSeason(show, seasonNumber, library);
				Episode episode = await GetEpisode(show, season, episodeNumber, absoluteNumber, path, library);
				_libraryManager.Register(episode);
			}
			if (collection != null)
				_libraryManager.Register(collection);
			_libraryManager.RegisterShowLinks(library, collection, show);
			await _libraryManager.SaveChanges();
		}

		private async Task<Collection> GetCollection(string collectionName, Library library)
		{
			if (string.IsNullOrEmpty(collectionName))
				return await Task.FromResult<Collection>(null);
			return _libraryManager.GetCollection(Utility.ToSlug(collectionName)) ?? await _metadataProvider.GetCollectionFromName(collectionName, library);
		}
		
		private async Task<Show> GetShow(string showTitle, string showPath, bool isMovie, Library library)
		{
			Show show = _libraryManager.GetShowByPath(showPath);
			if (show != null)
				return show;
			show = await _metadataProvider.SearchShow(showTitle, isMovie, library);
			show.Path = showPath;
			show.People = (await _metadataProvider.GetPeople(show, library))
				.GroupBy(x => x.Slug)
				.Select(x => x.First());
			await _thumbnailsManager.Validate(show.People);
			await _thumbnailsManager.Validate(show);
			return show;
		}

		private async Task<Season> GetSeason(Show show, long seasonNumber, Library library)
		{
			if (seasonNumber == -1)
				return default;
			Season season = _libraryManager.GetSeason(show.Slug, seasonNumber);
			if (season == null)
			{
				season = await _metadataProvider.GetSeason(show, seasonNumber, library);
				await _thumbnailsManager.Validate(season);
			}
			season.Show = show;
			return season;
		}
		
		private async Task<Episode> GetEpisode(Show show, Season season, long episodeNumber, long absoluteNumber, string episodePath, Library library)
		{
			Episode episode = await _metadataProvider.GetEpisode(show, episodePath, season?.SeasonNumber ?? -1, episodeNumber, absoluteNumber, library);
			if (season == null)
				season = await GetSeason(show, episode.SeasonNumber, library);
			episode.Season = season;
			if (season == null)
			{
				await Console.Error.WriteLineAsync("\tError: You don't have any provider that support absolute epiode numbering. Install one and try again.");
				return default;
			}
			
			await _thumbnailsManager.Validate(episode);
			await GetTracks(episode);
			return episode;
		}

		private async Task<Episode> GetMovie(Show show, string episodePath)
		{
			Episode episode = new Episode {Title = show.Title, Path = episodePath, Show = show};
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
