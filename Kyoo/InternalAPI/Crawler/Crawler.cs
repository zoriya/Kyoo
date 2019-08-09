using Kyoo.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

namespace Kyoo.InternalAPI
{
    public class Crawler : IHostedService
    {
        private readonly IConfiguration config;
        private readonly ILibraryManager libraryManager;
        private readonly IMetadataProvider metadataProvider;

        public Crawler(IConfiguration configuration, ILibraryManager libraryManager, IMetadataProvider metadataProvider)
        {
            config = configuration;
            this.libraryManager = libraryManager;
            this.metadataProvider = metadataProvider;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            Debug.WriteLine("&Crawler started");
            string[] paths = config.GetSection("libraryPaths").Get<string[]>();

            foreach (string path in paths)
            {
                Scan(path);
                Watch(path, cancellationToken);
            }

            while (!cancellationToken.IsCancellationRequested) ;

            Debug.WriteLine("&Crawler stopped");
            return null;
        }

        public async void Scan(string folderPath)
        {
            string[] files = Directory.GetFiles(folderPath);

            foreach (string file in files)
            {
                if(IsVideo(file) && !libraryManager.IsEpisodeRegistered(file))
                {
                    string patern = config.GetValue<string>("regex");
                    Regex regex = new Regex(patern, RegexOptions.IgnoreCase);
                    Match match = regex.Match(file);

                    string showPath = Path.GetDirectoryName(file);
                    string showName = match.Groups["ShowTitle"].Value;
                    bool seasonSuccess = long.TryParse(match.Groups["Season"].Value, out long seasonNumber);
                    bool episodeSucess = long.TryParse(match.Groups["Episode"].Value, out long episodeNumber);

                    string showProviderIDs;
                    if (!libraryManager.IsShowRegistered(showPath, out long showID))
                    {
                        Show show = await metadataProvider.GetShowFromName(showName, showPath);
                        showProviderIDs = show.ExternalIDs;
                        showID = libraryManager.RegisterShow(show);
                    }
                    else
                        showProviderIDs = libraryManager.GetShowExternalIDs(showID);

                    if(!libraryManager.IsSeasonRegistered(showID, seasonNumber, out long seasonID))
                    {
                        Season season = await metadataProvider.GetSeason(showName, seasonNumber);
                        season.ShowID = showID;
                        seasonID = libraryManager.RegisterSeason(season);
                    }

                    Episode episode = await metadataProvider.GetEpisode(showProviderIDs, seasonNumber, episodeNumber);
                    episode.ShowID = showID;
                    episode.SeasonID = seasonID;
                    libraryManager.RegisterEpisode(episode);
                }
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

                while (!cancellationToken.IsCancellationRequested) ;
            }
        }

        private void FileCreated(object sender, FileSystemEventArgs e)
        {
            Debug.WriteLine("&File Created at " + e.FullPath);
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


        private static readonly string[] videoExtensions = { ".webm", ".mkv", ".flv", ".vob", ".ogg", ".ogv", ".avi", ".mts", ".m2ts", ".ts", ".mov", ".qt", ".asf", ".mp4", ".m4p", ".m4v", ".mpg", ".mp2", ".mpeg", ".mpe", ".mpv", ".m2v", ".3gp", ".3g2" };

        private bool IsVideo(string filePath)
        {
            return videoExtensions.Contains(Path.GetExtension(filePath));
        }


        public Task StopAsync(CancellationToken cancellationToken)
        {
            return null;
        }
    }
}
