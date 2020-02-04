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

            Container = Path.Substring(Path.LastIndexOf('.') + 1);
            Link = Episode.GetSlug(ShowSlug, seasonNumber, episodeNumber);
        }

        public WatchItem(long episodeID, string showTitle, string showSlug, long seasonNumber, long episodeNumber, string title, DateTime? releaseDate, string path, Track[] audios, Track[] subtitles) 
	        : this(episodeID, showTitle, showSlug, seasonNumber, episodeNumber, title, releaseDate, path)
        {
            Audios = audios;
            Subtitles = subtitles;
        }
    }
}
