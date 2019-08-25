using Newtonsoft.Json;
using System;

namespace Kyoo.Models
{
    public class Episode
    {
        [JsonIgnore] public readonly long id;
        [JsonIgnore] public long ShowID;
        [JsonIgnore] public long SeasonID;

        public long episodeNumber;
        [JsonIgnore] public string Path;
        public string Title;
        public string Overview;
        public DateTime ReleaseDate;

        public long Runtime; //This runtime variable should be in seconds (used by the video manager so we need precisions)

        [JsonIgnore] public string ImgPrimary;
        public string ExternalIDs;

        public long RuntimeInMinutes
        {
            get
            {
                return Runtime / 60;
            }
        }


        public Episode() { }

        public Episode(long episodeNumber, string title, string overview, DateTime releaseDate, long runtime, string imgPrimary, string externalIDs)
        {
            id = -1;
            ShowID = -1;
            SeasonID = -1;
            this.episodeNumber = episodeNumber;
            Title = title;
            Overview = overview;
            ReleaseDate = releaseDate;
            Runtime = runtime;
            ImgPrimary = imgPrimary;
            ExternalIDs = externalIDs;
        }

        public Episode(long id, long showID, long seasonID, long episodeNumber, string path, string title, string overview, DateTime releaseDate, long runtime, string imgPrimary, string externalIDs)
        {
            this.id = id;
            ShowID = showID;
            SeasonID = seasonID;
            this.episodeNumber = episodeNumber;
            Path = path;
            Title = title;
            Overview = overview;
            ReleaseDate = releaseDate;
            Runtime = runtime;
            ImgPrimary = imgPrimary;
            ExternalIDs = externalIDs;
        }
    }
}
