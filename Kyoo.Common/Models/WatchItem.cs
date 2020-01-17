using Kyoo.Controllers;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;

namespace Kyoo.Models
{
    public class WatchItem
    {
        [JsonIgnore] public readonly long episodeID;

        public string ShowTitle;
        public string ShowSlug;
        public long seasonNumber;
        public long episodeNumber;
        public string Title;
        public string Link;
        public DateTime? ReleaseDate;
        [JsonIgnore] public string Path;
        public string previousEpisode;
        public Episode nextEpisode;

        public string container;
        public Track video;
        public IEnumerable<Track> audios;
        public IEnumerable<Track> subtitles;

        public WatchItem() { }

        public WatchItem(long episodeID, string showTitle, string showSlug, long seasonNumber, long episodeNumber, string title, DateTime? releaseDate, string path)
        {
            this.episodeID = episodeID;
            ShowTitle = showTitle;
            ShowSlug = showSlug;
            this.seasonNumber = seasonNumber;
            this.episodeNumber = episodeNumber;
            Title = title;
            ReleaseDate = releaseDate;
            Path = path;

            Link = Episode.GetSlug(ShowSlug, seasonNumber, episodeNumber);
        }

        public WatchItem(long episodeID, string showTitle, string showSlug, long seasonNumber, long episodeNumber, string title, DateTime? releaseDate, string path, Track[] audios, Track[] subtitles) : this(episodeID, showTitle, showSlug, seasonNumber, episodeNumber, title, releaseDate, path)
        {
            this.audios = audios;
            this.subtitles = subtitles;
        }

        public static WatchItem FromReader(System.Data.SQLite.SQLiteDataReader reader)
        {
            return new WatchItem((long)reader["id"],
                reader["showTitle"] as string,
                reader["showSlug"] as string,
                (long)reader["seasonNumber"],
                (long)reader["episodeNumber"],
                reader["title"] as string,
                reader["releaseDate"] as DateTime?,
                reader["path"] as string);
        }

        public WatchItem SetStreams(ILibraryManager libraryManager)
        {
            (Track video, IEnumerable<Track> audios, IEnumerable<Track> subtitles) streams = libraryManager.GetStreams(episodeID, Link);

            container = Path.Substring(Path.LastIndexOf('.') + 1);
            video = streams.video;
            audios = streams.audios;
            subtitles = streams.subtitles;
            return this;
        }

        public WatchItem SetPrevious(ILibraryManager libraryManager)
        {
            long lastEp = episodeNumber - 1;
            if(lastEp > 0)
                previousEpisode = ShowSlug + "-s" + seasonNumber + "e" + lastEp;
            else if(seasonNumber > 1)
            {
                int seasonCount = libraryManager.GetSeasonCount(ShowSlug, seasonNumber - 1);
                previousEpisode = ShowSlug + "-s" + (seasonNumber - 1) + "e" + seasonCount;
            }
            return this;
        }

        public WatchItem SetNext(ILibraryManager libraryManager)
        {
            long seasonCount = libraryManager.GetSeasonCount(ShowSlug, seasonNumber);
            if (episodeNumber >= seasonCount)
                nextEpisode = libraryManager.GetEpisode(ShowSlug, seasonNumber + 1, 1);
            else
                nextEpisode = libraryManager.GetEpisode(ShowSlug, seasonNumber, episodeNumber + 1);

            return this;
        }
    }
}
