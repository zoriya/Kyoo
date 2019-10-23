using Kyoo.InternalAPI.Utility;
using Kyoo.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

namespace Kyoo.InternalAPI
{
    public class Crawler : ICrawler
    {
        private static ICrawler runningCrawler;
        private readonly CancellationTokenSource cancellation;

        private readonly ILibraryManager libraryManager;
        private readonly IMetadataProvider metadataProvider;
        private readonly ITranscoder transcoder;
        private readonly IConfiguration config;

        public Crawler(ILibraryManager libraryManager, IMetadataProvider metadataProvider, ITranscoder transcoder, IConfiguration configuration)
        {
            this.libraryManager = libraryManager;
            this.metadataProvider = metadataProvider;
            this.transcoder = transcoder;
            this.config = configuration;

            cancellation = new CancellationTokenSource();
        }

        public Task Start(bool watch)
        {
            if (runningCrawler == null)
            {
                runningCrawler = this;
                return StartAsync(watch, cancellation.Token);
            }
            return null;
        }

        private Task StartAsync(bool watch, CancellationToken cancellationToken)
        {
            IEnumerable<Episode> episodes = libraryManager.GetAllEpisodes();
            IEnumerable<string> libraryPaths = libraryManager.GetLibrariesPath();

            Debug.WriteLine("&Crawler started");
            foreach (Episode episode in episodes)
            {
                if (!File.Exists(episode.Path))
                    libraryManager.RemoveEpisode(episode);
            }

            foreach (string path in libraryPaths)
            {
                Scan(path, cancellationToken);

                if(watch)
                    Watch(path, cancellationToken);
            }

            while (!cancellationToken.IsCancellationRequested);
            Debug.WriteLine("&Crawler stopped");
            runningCrawler = null;
            return null;
        }

        public async void Scan(string folderPath, CancellationToken cancellationToken)
        {
            string[] files = Directory.GetFiles(folderPath, "*", SearchOption.AllDirectories);

            foreach (string file in files)
            {
                if (cancellationToken.IsCancellationRequested)
                    return;

                if (IsVideo(file))
                {
                    Debug.WriteLine("&Registering episode at: " + file);
                    await ExtractEpisodeData(file, folderPath);
                }
            }
        }

        public void Watch(string folderPath, CancellationToken cancellationToken)
        {
            //Debug.WriteLine("&Watching " + folderPath + " for changes");
            //using (FileSystemWatcher watcher = new FileSystemWatcher())
            //{
            //    watcher.Path = folderPath;
            //    watcher.IncludeSubdirectories = true;
            //    watcher.NotifyFilter = NotifyFilters.LastAccess
            //                     | NotifyFilters.LastWrite
            //                     | NotifyFilters.FileName
            //                     | NotifyFilters.Size
            //                     | NotifyFilters.DirectoryName;

            //    watcher.Created += FileCreated;
            //    watcher.Changed += FileChanged;
            //    watcher.Renamed += FileRenamed;
            //    watcher.Deleted += FileDeleted;


            //    watcher.EnableRaisingEvents = true;

            //    while (!cancellationToken.IsCancellationRequested);
            //}
        }

        //private void FileCreated(object sender, FileSystemEventArgs e)
        //{
        //    Debug.WriteLine("&File Created at " + e.FullPath);
        //    if (IsVideo(e.FullPath))
        //    {
        //        Debug.WriteLine("&Created file is a video");
        //        _ = TryRegisterEpisode(e.FullPath);
        //    }
        //}

        //private void FileChanged(object sender, FileSystemEventArgs e)
        //{
        //    Debug.WriteLine("&File Changed at " + e.FullPath);
        //}

        //private void FileRenamed(object sender, RenamedEventArgs e)
        //{
        //    Debug.WriteLine("&File Renamed at " + e.FullPath);
        //}

        //private void FileDeleted(object sender, FileSystemEventArgs e)
        //{
        //    Debug.WriteLine("&File Deleted at " + e.FullPath);
        //}



        private async Task ExtractEpisodeData(string episodePath, string libraryPath)
        {
            if (!libraryManager.IsEpisodeRegistered(episodePath))
            {
                string relativePath = episodePath.Substring(libraryPath.Length);
                string patern = config.GetValue<string>("regex");
                Regex regex = new Regex(patern, RegexOptions.IgnoreCase);
                Match match = regex.Match(relativePath);

                string showPath = Path.GetDirectoryName(episodePath);
                string collectionName = match.Groups["Collection"]?.Value;
                string showName = match.Groups["ShowTitle"].Value;
                bool seasonSuccess = long.TryParse(match.Groups["Season"].Value, out long seasonNumber);
                bool episodeSucess = long.TryParse(match.Groups["Episode"].Value, out long episodeNumber);
                long absoluteNumber = -1;

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
                        Debug.WriteLine("&Couldn't find basic data for the episode (regexs didn't match) at " + episodePath);
                        return;
                    }
                }

                Show show = await RegisterOrGetShow(collectionName, showName, showPath, libraryPath);
                if (show != null)
                    await RegisterEpisode(show, seasonNumber, episodeNumber, absoluteNumber, episodePath);
            }
        }

        private async Task<Show> RegisterOrGetShow(string collectionName, string showTitle, string showPath, string libraryPath)
        {
            string showProviderIDs;

            if (!libraryManager.IsShowRegistered(showPath, out long showID))
            {
                Show show = await metadataProvider.GetShowFromName(showTitle, showPath);
                showProviderIDs = show.ExternalIDs;
                showID = libraryManager.RegisterShow(show);

                if (showID == -1)
                    return null;

                libraryManager.RegisterInLibrary(showID, libraryPath);
                if (collectionName != null && collectionName.Length > 0)
                {
                    if (!libraryManager.IsCollectionRegistered(Slugifier.ToSlug(collectionName), out long collectionID))
                    {
                        Collection collection = await metadataProvider.GetCollectionFromName(collectionName);
                        collectionID = libraryManager.RegisterCollection(collection);
                    }
                    libraryManager.AddShowToCollection(showID, collectionID);
                }

                List<People> actors = await metadataProvider.GetPeople(show.ExternalIDs);
                libraryManager.RegisterShowPeople(showID, actors);
            }
            else
                showProviderIDs = libraryManager.GetShowExternalIDs(showID);

            return new Show { id = showID, ExternalIDs = showProviderIDs, Title = showTitle };
        }

        private async Task RegisterEpisode(Show show, long seasonNumber, long episodeNumber, long absoluteNumber, string episodePath)
        {
            long seasonID = -1;
            if (seasonNumber != -1)
            {
                if (!libraryManager.IsSeasonRegistered(show.id, seasonNumber, out seasonID))
                {
                    Season season = await metadataProvider.GetSeason(show.Title, seasonNumber);
                    season.ShowID = show.id;
                    seasonID = libraryManager.RegisterSeason(season);
                }
            }

            Episode episode = await metadataProvider.GetEpisode(show.ExternalIDs, seasonNumber, episodeNumber, absoluteNumber, episodePath);
            episode.ShowID = show.id;

            if (seasonID == -1)
            {
                if (!libraryManager.IsSeasonRegistered(show.id, episode.seasonNumber, out seasonID))
                {
                    Season season = await metadataProvider.GetSeason(show.Title, episode.seasonNumber);
                    season.ShowID = show.id;
                    seasonID = libraryManager.RegisterSeason(season);
                }
            }

            episode.SeasonID = seasonID;
            episode.id = libraryManager.RegisterEpisode(episode);

            if (episode.Path.EndsWith(".mkv"))
            {
                if (!FindExtractedSubtitles(episode))
                {
                    Track[] tracks = await transcoder.ExtractSubtitles(episode.Path);
                    if (tracks != null)
                    {
                        foreach (Track track in tracks)
                        {
                            track.episodeID = episode.id;
                            libraryManager.RegisterTrack(track);
                        }
                    }
                }
            }
        }


        private bool FindExtractedSubtitles(Episode episode)
        {
            string path = Path.Combine(Path.GetDirectoryName(episode.Path), "Subtitles");
            if(Directory.Exists(path))
            {
                bool ret = false;
                foreach (string sub in Directory.EnumerateFiles(path, "", SearchOption.AllDirectories))
                {
                    string episodeLink = Path.GetFileNameWithoutExtension(episode.Path);

                    if (sub.Contains(episodeLink))
                    {
                        string language = sub.Substring(Path.GetDirectoryName(sub).Length + episodeLink.Length + 2, 3);
                        bool isDefault = sub.Contains("default");
                        bool isForced = sub.Contains("forced");

                        string codec;
                        switch (Path.GetExtension(sub))
                        {
                            case ".ass":
                                codec = "ass";
                                break;
                            case ".srt":
                                codec = "subrip";
                                break;
                            default:
                                codec = null;
                                break;
                        }


                        Track track = new Track(Models.Watch.StreamType.Subtitle, null, language, isDefault, isForced, codec, false, sub) { episodeID = episode.id };
                        libraryManager.RegisterTrack(track);

                        ret = true;
                    }
                }

                return ret;
            }

            return false;
        }

        private static readonly string[] videoExtensions = { ".webm", ".mkv", ".flv", ".vob", ".ogg", ".ogv", ".avi", ".mts", ".m2ts", ".ts", ".mov", ".qt", ".asf", ".mp4", ".m4p", ".m4v", ".mpg", ".mp2", ".mpeg", ".mpe", ".mpv", ".m2v", ".3gp", ".3g2" };

        private bool IsVideo(string filePath)
        {
            return videoExtensions.Contains(Path.GetExtension(filePath));
        }


        public Task StopAsync()
        {
            cancellation.Cancel();
            return null;
        }
    }
}
