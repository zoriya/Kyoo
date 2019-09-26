using Newtonsoft.Json;
using System;

namespace Kyoo.Models
{
    public class Episode
    {
        [JsonIgnore] public long id;
        [JsonIgnore] public long ShowID;
        [JsonIgnore] public long SeasonID;

        public long seasonNumber;
        public long episodeNumber;
        [JsonIgnore] public string Path;
        public string Title;
        public string Overview;
        public DateTime? ReleaseDate;

        public long Runtime; //This runtime variable should be in minutes

        [JsonIgnore] public string ImgPrimary;
        public string ExternalIDs;

        public string Link; //Used only on the player
        public string Thumb; //Used in the API response only


        public Episode() { }

        public Episode(long seasonNumber, long episodeNumber, string title, string overview, DateTime? releaseDate, long runtime, string imgPrimary, string externalIDs)
        {
            id = -1;
            ShowID = -1;
            SeasonID = -1;
            this.seasonNumber = seasonNumber;
            this.episodeNumber = episodeNumber;
            Title = title;
            Overview = overview;
            ReleaseDate = releaseDate;
            Runtime = runtime;
            ImgPrimary = imgPrimary;
            ExternalIDs = externalIDs;
        }

        public Episode(long id, long showID, long seasonID, long seasonNumber, long episodeNumber, string path, string title, string overview, DateTime? releaseDate, long runtime, string imgPrimary, string externalIDs)
        {
            this.id = id;
            ShowID = showID;
            SeasonID = seasonID;
            this.seasonNumber = seasonNumber;
            this.episodeNumber = episodeNumber;
            Path = path;
            Title = title;
            Overview = overview;
            ReleaseDate = releaseDate;
            Runtime = runtime;
            ImgPrimary = imgPrimary;
            ExternalIDs = externalIDs;
        }

        public static Episode FromReader(System.Data.SQLite.SQLiteDataReader reader)
        {
            return new Episode((long)reader["id"],
                (long)reader["showID"],
                (long)reader["seasonID"],
                (long)reader["seasonNumber"],
                (long)reader["episodeNumber"],
                reader["path"] as string,
                reader["title"] as string,
                reader["overview"] as string,
                reader["releaseDate"] as DateTime?,
                (long)reader["runtime"],
                reader["imgPrimary"] as string,
                reader["externalIDs"] as string);
        }


        public Episode SetThumb(string showSlug)
        {
            Link = GetSlug(showSlug, seasonNumber, episodeNumber);
            Thumb = "thumb/" + Link;
            return this;
        }

        public static string GetSlug(string showSlug, long seasonNumber, long episodeNumber)
        {
            return showSlug + "-s" + seasonNumber + "e" + episodeNumber;
        }
    }
}
