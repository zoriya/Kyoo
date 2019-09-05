using Kyoo.InternalAPI;
using Kyoo.Models.Watch;
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
        public DateTime? ReleaseDate;
        [JsonIgnore] public string Path;

        [JsonIgnore] public VideoStream video;
        public IEnumerable<Stream> audios;
        public IEnumerable<Stream> subtitles;

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
        }

        public WatchItem(long episodeID, string showTitle, string showSlug, long seasonNumber, long episodeNumber, string title, DateTime? releaseDate, string path, Stream[] audios, Stream[] subtitles) : this(episodeID, showTitle, showSlug, seasonNumber, episodeNumber, title, releaseDate, path)
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
            (VideoStream video, IEnumerable<Stream> audios, IEnumerable<Stream> subtitles) streams = libraryManager.GetStreams(episodeID);
            video = streams.video;
            audios = streams.audios;
            subtitles = streams.subtitles;
            return this;
        }
    }
}
