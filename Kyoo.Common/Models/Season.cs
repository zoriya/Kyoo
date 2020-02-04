using System.Collections;
using System.Collections.Generic;
using Newtonsoft.Json;

namespace Kyoo.Models
{
    public class Season : IMergable<Season>
    {
        [JsonIgnore] public long ID  { get; set; } = -1;
        [JsonIgnore] public long ShowID { get; set; } = -1;

        public long SeasonNumber { get; set; } = -1;
        public string Title { get; set; }
        public string Overview { get; set; }
        public long? Year { get; set; }

        [JsonIgnore] public string ImgPrimary { get; set; }
        public string ExternalIDs { get; set; }

        public virtual Show Show { get; set; }
        public virtual IEnumerable<Episode> Episodes { get; set; }

        public Season() { }

        public Season(long id, long showID, long seasonNumber, string title, string overview, long? year, string imgPrimary, string externalIDs)
        {
            ID = id;
            ShowID = showID;
            SeasonNumber = seasonNumber;
            Title = title;
            Overview = overview;
            Year = year;
            ImgPrimary = imgPrimary;
            ExternalIDs = externalIDs;
        }

        public static Season FromReader(System.Data.SQLite.SQLiteDataReader reader)
        {
            return new Season((long)reader["id"],
                (long)reader["showID"],
                (long)reader["seasonNumber"],
                reader["title"] as string,
                reader["overview"] as string,
                reader["year"] as long?,
                reader["imgPrimary"] as string,
                reader["externalIDs"] as string);
        }

        public Season Merge(Season other)
        {
            if (other == null)
                return this;
	        if (ShowID == -1)
		        ShowID = other.ShowID;
	        if (SeasonNumber == -1)
		        SeasonNumber = other.SeasonNumber;
	        if (Title == null)
		        Title = other.Title;
	        if (Overview == null)
		        Overview = other.Overview;
	        if (Year == null)
		        Year = other.Year;
	        if (ImgPrimary == null)
		        ImgPrimary = other.ImgPrimary;
		    ExternalIDs += '|' + other.ExternalIDs;
            return this;
        }
    }
}
