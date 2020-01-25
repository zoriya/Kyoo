using Newtonsoft.Json;

namespace Kyoo.Models
{
    public class Season : IMergable<Season>
    {
        [JsonIgnore] public readonly long ID = -1;
        [JsonIgnore] public long ShowID = -1;

        public long SeasonNumber = -1;
        public string Title;
        public string Overview;
        public long? Year;

        [JsonIgnore] public string ImgPrimary;
        public string ExternalIDs;

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
