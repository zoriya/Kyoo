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
		private IProviderManager _metadataProvider;
		private ITranscoder _transcoder;
		private IConfiguration _config;
		
		
		public async Task Run(IServiceProvider serviceProvider, CancellationToken cancellationToken)
		{
			using IServiceScope serviceScope = serviceProvider.CreateScope();
			_libraryManager = serviceScope.ServiceProvider.GetService<ILibraryManager>();
			_metadataProvider = serviceScope.ServiceProvider.GetService<IProviderManager>();
			_transcoder = serviceScope.ServiceProvider.GetService<ITranscoder>();
			_config = serviceScope.ServiceProvider.GetService<IConfiguration>();

			try
			{
				IEnumerable<Episode> episodes = _libraryManager.GetAllEpisodes();
				IEnumerable<Library> libraries = _libraryManager.GetLibraries();

				foreach (Episode episode in episodes)
				{
					if (!File.Exists(episode.Path))
						_libraryManager.RemoveEpisode(episode.ID);
				}

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
				foreach (string file in Directory.GetFiles(path, "*", SearchOption.AllDirectories))
				{
					if (cancellationToken.IsCancellationRequested)
						return;
					if (!IsVideo(file) || _libraryManager.IsEpisodeRegistered(file, out long _))
						continue;
					string relativePath = file.Substring(path.Length);
					await RegisterFile(file, relativePath, library);
				}
			}
		}

		private async Task RegisterFile(string path, string relativePath, Library library)
		{
			Console.WriteLine("Registering episode at: " + path);
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
				_libraryManager.RegisterMovie(await GetMovie(show, path));
			else
			{
				Season season = await GetSeason(show, seasonNumber, library);
				Episode episode = await GetEpisode(show, season, episodeNumber, absoluteNumber, path, library);
				if (_libraryManager.RegisterEpisode(episode) == 0)
					return;
			}
			if (collection != null)
				_libraryManager.RegisterCollection(collection);
			_libraryManager.RegisterShowLinks(library, collection, show);
		}

		private async Task<Collection> GetCollection(string collectionName, Library library)
		{
			if (string.IsNullOrEmpty(collectionName))
				return await Task.FromResult<Collection>(null);
			return _libraryManager.GetCollection(Utility.ToSlug(collectionName)) ?? await _metadataProvider.GetCollectionFromName(collectionName, library);
		}
		
		private async Task<Show> GetShow(string showTitle, string showPath, bool isMovie, Library library)
		{
			Show show = _libraryManager.GetShow(showPath);
			if (show != null)
				return show;
			show = await _metadataProvider.GetShowFromName(showTitle, showPath, isMovie, library);
			show.People = (await _metadataProvider.GetPeople(show, library)).GroupBy(x => x.Slug).Select(x => x.First())
				.Select(x =>
				{
					People existing = _libraryManager.GetPeopleBySlug(x.Slug);
					return existing != null ? new PeopleLink(existing, show, x.Role, x.Type) : x;
				}).ToList();
			return show;
		}

		private async Task<Season> GetSeason(Show show, long seasonNumber, Library library)
		{
			if (seasonNumber == -1)
				return null;
			Season season = _libraryManager.GetSeason(show.Slug, seasonNumber);
			if (season != null)
				return await Task.FromResult(season);
			return await _metadataProvider.GetSeason(show, seasonNumber, library);
		}
		
		private async Task<Episode> GetEpisode(Show show, Season season, long episodeNumber, long absoluteNumber, string episodePath, Library library)
		{
			Episode episode = await _metadataProvider.GetEpisode(show, episodePath, season?.SeasonNumber ?? -1, episodeNumber, absoluteNumber, library);
			if (season == null)
				season = await GetSeason(show, episode.SeasonNumber, library);
			episode.Season = season;
			if (season == null)
			{
				Console.Error.WriteLine("\tError: You don't have any provider that support absolute epiode numbering. Install one and try again.");
				return null;
			}

			await GetTracks(episode);
			return episode;
		}

		private async Task<Episode> GetMovie(Show show, string episodePath)
		{
			Episode episode = new Episode();
			episode.Title = show.Title;
			episode.Path = episodePath;
			episode.Show = show;
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
			string path = Path.Combine(Path.GetDirectoryName(episode.Path), "Subtitles");
			List<Track> tracks = new List<Track>();
			
			if (!Directory.Exists(path)) 
				return tracks;
			foreach (string sub in Directory.EnumerateFiles(path, "", SearchOption.AllDirectories))
			{
				string episodeLink = Path.GetFileNameWithoutExtension(episode.Path);

				if (!sub.Contains(episodeLink))
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
