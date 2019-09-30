﻿using Kyoo.Models;
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
        private readonly CancellationTokenSource cancellation;

        private readonly IConfiguration config;
        private readonly ILibraryManager libraryManager;
        private readonly IMetadataProvider metadataProvider;
        private readonly ITranscoder transcoder;

        public Crawler(IConfiguration configuration, ILibraryManager libraryManager, IMetadataProvider metadataProvider, ITranscoder transcoder)
        {
            config = configuration;
            this.libraryManager = libraryManager;
            this.metadataProvider = metadataProvider;
            this.transcoder = transcoder;

            cancellation = new CancellationTokenSource();
        }

        public Task Start(bool watch)
        {
            return StartAsync(watch, cancellation.Token);
        }

        private Task StartAsync(bool watch, CancellationToken cancellationToken)
        {
            Debug.WriteLine("&Crawler started");
            string[] paths = config.GetSection("libraryPaths").Get<string[]>();

            foreach (string path in paths)
            {
                Scan(path, cancellationToken);

                if(watch)
                    Watch(path, cancellationToken);
            }

            while (!cancellationToken.IsCancellationRequested);

            Debug.WriteLine("&Crawler stopped");
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
                    await TryRegisterEpisode(file);
            }
        }

        public void Watch(string folderPath, CancellationToken cancellationToken)
        {
            Debug.WriteLine("&Watching " + folderPath + " for changes");
            using (FileSystemWatcher watcher = new FileSystemWatcher())
            {
                watcher.Path = folderPath;
                watcher.IncludeSubdirectories = true;
                watcher.NotifyFilter = NotifyFilters.LastAccess
                                 | NotifyFilters.LastWrite
                                 | NotifyFilters.FileName
                                 | NotifyFilters.Size
                                 | NotifyFilters.DirectoryName;

                watcher.Created += FileCreated;
                watcher.Changed += FileChanged;
                watcher.Renamed += FileRenamed;
                watcher.Deleted += FileDeleted;


                watcher.EnableRaisingEvents = true;

                while (!cancellationToken.IsCancellationRequested);
            }
        }

        private void FileCreated(object sender, FileSystemEventArgs e)
        {
            Debug.WriteLine("&File Created at " + e.FullPath);
            if (IsVideo(e.FullPath))
            {
                Debug.WriteLine("&Created file is a video");
                _ = TryRegisterEpisode(e.FullPath);
            }
        }

        private void FileChanged(object sender, FileSystemEventArgs e)
        {
            Debug.WriteLine("&File Changed at " + e.FullPath);
        }

        private void FileRenamed(object sender, RenamedEventArgs e)
        {
            Debug.WriteLine("&File Renamed at " + e.FullPath);
        }

        private void FileDeleted(object sender, FileSystemEventArgs e)
        {
            Debug.WriteLine("&File Deleted at " + e.FullPath);
        }



        private async Task TryRegisterEpisode(string path)
        {
            if (!libraryManager.IsEpisodeRegistered(path))
            {
                string patern = config.GetValue<string>("regex");
                Regex regex = new Regex(patern, RegexOptions.IgnoreCase);
                Match match = regex.Match(path);

                string showPath = Path.GetDirectoryName(path);
                string showName = match.Groups["ShowTitle"].Value;
                bool seasonSuccess = long.TryParse(match.Groups["Season"].Value, out long seasonNumber);
                bool episodeSucess = long.TryParse(match.Groups["Episode"].Value, out long episodeNumber);
                long absoluteNumber = -1;

                if(!seasonSuccess || !episodeSucess)
                {
                    //Considering that the episode is using absolute path.
                    seasonNumber = -1;
                    episodeNumber = -1;

                    regex = new Regex(config.GetValue<string>("absoluteRegex"));
                    match = regex.Match(path);

                    showName = match.Groups["ShowTitle"].Value;
                    bool absoluteSucess = long.TryParse(match.Groups["AbsoluteNumber"].Value, out absoluteNumber);

                    if (!absoluteSucess)
                    {
                        Debug.WriteLine("&Couldn't find basic data for the episode (regexs didn't match) at " + path);
                        return;
                    }
                }

                string showProviderIDs;
                if (!libraryManager.IsShowRegistered(showPath, out long showID))
                {
                    Show show = await metadataProvider.GetShowFromName(showName, showPath);
                    showProviderIDs = show.ExternalIDs;
                    showID = libraryManager.RegisterShow(show);

                    List<People> actors = await metadataProvider.GetPeople(show.ExternalIDs);
                    libraryManager.RegisterShowPeople(showID, actors);
                }
                else
                    showProviderIDs = libraryManager.GetShowExternalIDs(showID);

                long seasonID = -1;
                if (seasonNumber != -1)
                {
                    if (!libraryManager.IsSeasonRegistered(showID, seasonNumber, out seasonID))
                    {
                        Season season = await metadataProvider.GetSeason(showName, seasonNumber);
                        season.ShowID = showID;
                        seasonID = libraryManager.RegisterSeason(season);
                    }
                }

                Episode episode = await metadataProvider.GetEpisode(showProviderIDs, seasonNumber, episodeNumber, absoluteNumber, path);
                episode.ShowID = showID;

                if(seasonID == -1)
                {
                    if (!libraryManager.IsSeasonRegistered(showID, episode.seasonNumber, out seasonID))
                    {
                        Season season = await metadataProvider.GetSeason(showName, episode.seasonNumber);
                        season.ShowID = showID;
                        seasonID = libraryManager.RegisterSeason(season);
                    }
                }

                episode.SeasonID = seasonID;
                long episodeID = libraryManager.RegisterEpisode(episode);
                episode.id = episodeID;

                if (episode.Path.EndsWith(".mkv"))
                {
                    if (!FindExtractedSubtitles(episode))
                    {
                        Track[] tracks = transcoder.ExtractSubtitles(episode.Path);
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
                            case ".str":
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
