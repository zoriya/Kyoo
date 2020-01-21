using Newtonsoft.Json;

namespace Kyoo.Models
{
    public class Season : IMergable<Season>
    {
        [JsonIgnore] public readonly long id;
        [JsonIgnore] public long ShowID;

        public long seasonNumber;
        public string Title;
        public string Overview;
        public long? year;

        [JsonIgnore] public string ImgPrimary;
        public string ExternalIDs;

        public Season() { }

        public Season(long id, long showID, long seasonNumber, string title, string overview, long? year, string imgPrimary, string externalIDs)
        {
            this.id = id;
            ShowID = showID;
            this.seasonNumber = seasonNumber;
            Title = title;
            Overview = overview;
            this.year = year;
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
	        if (ShowID == -1)
		        ShowID = other.ShowID;
	        if (seasonNumber == -1)
		        seasonNumber = other.seasonNumber;
	        if (Title == null)
		        Title = other.Title;
	        if (Overview == null)
		        Overview = other.Overview;
	        if (year == null)
		        year = other.year;
	        if (ImgPrimary == null)
		        ImgPrimary = other.ImgPrimary;
		    ExternalIDs += '|' + other.ExternalIDs;
            return this;
        }
    }
}
