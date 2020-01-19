using Kyoo.Models;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Kyoo.Controllers.Utility;
using Kyoo.Models.Watch;

namespace Kyoo.Controllers
{
    public class Crawler : ICrawler
    {
        private bool isRunning;
        private readonly CancellationTokenSource cancellation;

        private readonly ILibraryManager libraryManager;
        private readonly IProviderManager metadataProvider;
        private readonly ITranscoder transcoder;
        private readonly IConfiguration config;

        public Crawler(ILibraryManager libraryManager, IProviderManager metadataProvider, ITranscoder transcoder, IConfiguration configuration)
        {
            this.libraryManager = libraryManager;
            this.metadataProvider = metadataProvider;
            this.transcoder = transcoder;
            config = configuration;
            cancellation = new CancellationTokenSource();
        }

        public void Start()
        {
            if (isRunning)
                return;
            isRunning = true;
            StartAsync(cancellation.Token);
        }

        public void Cancel()
        {
            if (!isRunning)
                return;
            isRunning = false;
            cancellation.Cancel();
        }

        private async void StartAsync(CancellationToken cancellationToken)
        {
            IEnumerable<Episode> episodes = libraryManager.GetAllEpisodes();
            IEnumerable<Library> libraries = libraryManager.GetLibraries();

            Debug.WriteLine("&Crawler started");
            foreach (Episode episode in episodes)
            {
                if (!File.Exists(episode.Path))
                    libraryManager.RemoveEpisode(episode);
            }

            foreach (Library library in libraries)
                await Scan(library, cancellationToken);

            isRunning = false;
            Debug.WriteLine("&Crawler stopped");
        }

        private async Task Scan(Library library, CancellationToken cancellationToken)
        {
            IEnumerable<string> files = new List<string>();

            files = library.Paths.Aggregate(files, (current, path) => 
                current.Concat(Directory.GetFiles(path, "*", SearchOption.AllDirectories)));
            foreach (string file in files)
            {
                if (cancellationToken.IsCancellationRequested)
                    return;
                if (!IsVideo(file))
                    continue;
                await RegisterFile(file, library);
            }
        }

        private async Task RegisterFile(string path, Library library)
        {
            if (!libraryManager.IsEpisodeRegistered(path))
            {
                string relativePath = path.Substring(library.Paths.Length);
                string patern = config.GetValue<string>("regex");
                Regex regex = new Regex(patern, RegexOptions.IgnoreCase);
                Match match = regex.Match(relativePath);

                string showPath = Path.GetDirectoryName(path);
                string collectionName = match.Groups["Collection"]?.Value;
                string showName = match.Groups["ShowTitle"].Value;
                bool seasonSuccess = long.TryParse(match.Groups["Season"].Value, out long seasonNumber);
                bool episodeSucess = long.TryParse(match.Groups["Episode"].Value, out long episodeNumber);
                long absoluteNumber = -1;

                Debug.WriteLine("&Registering episode at: " + path);
                if (!seasonSuccess || !episodeSucess)
                {
                    //Considering that the episode is using absolute path.
                    seasonNumber = -1;
                    episodeNumber = -1;

                    regex = new Regex(config.GetValue<string>("absoluteRegex"));
                    match = regex.Match(relativePath);

                    showName = match.Groups["ShowTitle"].Value;
                    bool absoluteSucess = long.TryParse(match.Groups["AbsoluteNumber"].Value, out absoluteNumber);

                    if (!absoluteSucess)
                    {
                        Debug.WriteLine("&Couldn't find basic data for the episode (regexs didn't match)" + relativePath);
                        return;
                    }
                }

                Show show = await RegisterOrGetShow(collectionName, showName, showPath, library);
                if (show != null)
                    await RegisterEpisode(show, seasonNumber, episodeNumber, absoluteNumber, path, library);
            }
        }

        private async Task<Show> RegisterOrGetShow(string collectionName, string showTitle, string showPath, Library library)
        {
            string showProviderIDs;

            if (!libraryManager.IsShowRegistered(showPath, out long showID))
            {
                Show show = await metadataProvider.GetShowFromName(showTitle, library);
                show.Path = showPath;
                showProviderIDs = show.ExternalIDs;
                showID = libraryManager.RegisterShow(show);

                if (showID == -1)
                    return null;

                libraryManager.RegisterInLibrary(showID, library);
                if (!string.IsNullOrEmpty(collectionName))
                {
                    if (!libraryManager.IsCollectionRegistered(Slugifier.ToSlug(collectionName), out long collectionID))
                    {
                        Collection collection = await metadataProvider.GetCollectionFromName(collectionName, library);
                        collectionID = libraryManager.RegisterCollection(collection);
                    }
                    libraryManager.AddShowToCollection(showID, collectionID);
                }

                IEnumerable<People> actors = await metadataProvider.GetPeople(show.ExternalIDs, library);
                libraryManager.RegisterShowPeople(showID, actors);
            }
            else
                showProviderIDs = libraryManager.GetShowExternalIDs(showID);

            return new Show { id = showID, ExternalIDs = showProviderIDs, Title = showTitle };
        }

        private async Task RegisterEpisode(Show show, long seasonNumber, long episodeNumber, long absoluteNumber, string episodePath, Library library)
        {
            long seasonID = -1;
            if (seasonNumber != -1)
            {
                if (!libraryManager.IsSeasonRegistered(show.id, seasonNumber, out seasonID))
                {
                    Season season = await metadataProvider.GetSeason(show.Title, seasonNumber, library);
                    season.ShowID = show.id;
                    seasonID = libraryManager.RegisterSeason(season);
                }
            }

            Episode episode = await metadataProvider.GetEpisode(show.ExternalIDs, seasonNumber, episodeNumber, absoluteNumber, library);
            episode.ShowID = show.id;
            episode.Path = episodePath;

            if (seasonID == -1)
            {
                if (!libraryManager.IsSeasonRegistered(show.id, episode.seasonNumber, out seasonID))
                {
                    Season season = await metadataProvider.GetSeason(show.Title, episode.seasonNumber, library);
                    season.ShowID = show.id;
                    seasonID = libraryManager.RegisterSeason(season);
                }
            }

            episode.SeasonID = seasonID;
            episode.id = libraryManager.RegisterEpisode(episode);

            Track[] tracks = await transcoder.GetTrackInfo(episode.Path);
            int subcount = 0;
            foreach (Track track in tracks)
            {
                if (track.Type == StreamType.Subtitle)
                {
                    subcount++;
                    continue;
                }
                track.episodeID = episode.id;
                libraryManager.RegisterTrack(track);
            }

            if (episode.Path.EndsWith(".mkv") && CountExtractedSubtitles(episode) != subcount)
            {
                Track[] subtitles = await transcoder.ExtractSubtitles(episode.Path);
                if (subtitles != null)
                {
                    foreach (Track track in subtitles)
                    {
                        track.episodeID = episode.id;
                        libraryManager.RegisterTrack(track);
                    }
                }
            }
        }

        private int CountExtractedSubtitles(Episode episode)
        {
            string path = Path.Combine(Path.GetDirectoryName(episode.Path), "Subtitles");
            int subcount = 0;
            
            if (!Directory.Exists(path)) 
                return 0;
            foreach (string sub in Directory.EnumerateFiles(path, "", SearchOption.AllDirectories))
            {
                string episodeLink = Path.GetFileNameWithoutExtension(episode.Path);

                if (sub.Contains(episodeLink))
                {
                    string language = sub.Substring(Path.GetDirectoryName(sub).Length + episodeLink.Length + 2, 3);
                    bool isDefault = sub.Contains("default");
                    bool isForced = sub.Contains("forced");
                    Track track = new Track(StreamType.Subtitle, null, language, isDefault, isForced, null, false, sub) { episodeID = episode.id };

                    if (Path.GetExtension(sub) == ".ass")
                        track.Codec = "ass";
                    else if (Path.GetExtension(sub) == ".srt")
                        track.Codec = "subrip";
                    else
                        track.Codec = null;
                    libraryManager.RegisterTrack(track);
                    subcount++;
                }
            }
            return subcount;
        }

        private static readonly string[] VideoExtensions = { ".webm", ".mkv", ".flv", ".vob", ".ogg", ".ogv", ".avi", ".mts", ".m2ts", ".ts", ".mov", ".qt", ".asf", ".mp4", ".m4p", ".m4v", ".mpg", ".mp2", ".mpeg", ".mpe", ".mpv", ".m2v", ".3gp", ".3g2" };

        private static bool IsVideo(string filePath)
        {
            return VideoExtensions.Contains(Path.GetExtension(filePath));
        }


        public Task StopAsync()
        {
            cancellation.Cancel();
            return null;
        }
    }
}
