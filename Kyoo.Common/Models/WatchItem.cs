using Kyoo.Controllers;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;

namespace Kyoo.Models
{
    public class WatchItem
    {
        [JsonIgnore] public readonly long EpisodeID = -1;

        public string ShowTitle;
        public string ShowSlug;
        public long SeasonNumber;
        public long EpisodeNumber;
        public string Title;
        public string Link;
        public DateTime? ReleaseDate;
        [JsonIgnore] public string Path;
        public string PreviousEpisode;
        public Episode NextEpisode;

        public string Container;
        public Track Video;
        public IEnumerable<Track> Audios;
        public IEnumerable<Track> Subtitles;

        public WatchItem() { }

        public WatchItem(long episodeID, string showTitle, string showSlug, long seasonNumber, long episodeNumber, string title, DateTime? releaseDate, string path)
        {
            EpisodeID = episodeID;
            ShowTitle = showTitle;
            ShowSlug = showSlug;
            SeasonNumber = seasonNumber;
            EpisodeNumber = episodeNumber;
            Title = title;
            ReleaseDate = releaseDate;
            Path = path;

            Link = Episode.GetSlug(ShowSlug, seasonNumber, episodeNumber);
        }

        public WatchItem(long episodeID, string showTitle, string showSlug, long seasonNumber, long episodeNumber, string title, DateTime? releaseDate, string path, Track[] audios, Track[] subtitles) : this(episodeID, showTitle, showSlug, seasonNumber, episodeNumber, title, releaseDate, path)
        {
            Audios = audios;
            Subtitles = subtitles;
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
            (Track video, IEnumerable<Track> audios, IEnumerable<Track> subtitles) streams = libraryManager.GetStreams(EpisodeID, Link);

            Container = Path.Substring(Path.LastIndexOf('.') + 1);
            Video = streams.video;
            Audios = streams.audios;
            Subtitles = streams.subtitles;
            return this;
        }

        public WatchItem SetPrevious(ILibraryManager libraryManager)
        {
            long lastEp = EpisodeNumber - 1;
            if(lastEp > 0)
                PreviousEpisode = ShowSlug + "-s" + SeasonNumber + "e" + lastEp;
            else if(SeasonNumber > 1)
            {
                int seasonCount = libraryManager.GetSeasonCount(ShowSlug, SeasonNumber - 1);
                PreviousEpisode = ShowSlug + "-s" + (SeasonNumber - 1) + "e" + seasonCount;
            }
            return this;
        }

        public WatchItem SetNext(ILibraryManager libraryManager)
        {
            long seasonCount = libraryManager.GetSeasonCount(ShowSlug, SeasonNumber);
            if (EpisodeNumber >= seasonCount)
                NextEpisode = libraryManager.GetEpisode(ShowSlug, SeasonNumber + 1, 1);
            else
                NextEpisode = libraryManager.GetEpisode(ShowSlug, SeasonNumber, EpisodeNumber + 1);

            return this;
        }
    }
}
