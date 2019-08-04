using System.Collections.Generic;

namespace Kyoo.Models
{
    public class Show
    {
        public readonly int id;

        public string Uri;
        public string Title;
        public List<string> Aliases;
        public string Overview;
        public Status Status;

        public int StartYear;
        public int EndYear;

        public string ImgPrimary;
        public string ImgThumb;
        public string ImgBanner;
        public string ImgLogo;
        public string ImgBackdrop;

        public string ExternalIDs;


        public Show(int id, string uri, string title, List<string> aliases, string overview, Status status, int startYear, int endYear, string imgPrimary, string imgThumb, string imgBanner, string imgLogo, string imgBackdrop, string externalIDs)
        {
            this.id = id;
            Uri = uri;
            Title = title;
            Aliases = aliases;
            Overview = overview;
            Status = status;
            StartYear = startYear;
            EndYear = endYear;
            ImgPrimary = imgPrimary;
            ImgThumb = imgThumb;
            ImgBanner = imgBanner;
            ImgLogo = imgLogo;
            ImgBackdrop = imgBackdrop;
            ExternalIDs = externalIDs;
        }

        //Cast error here (Unable to cast object of type 'System.Int64' to type 'System.Int32'.)
        public static Show FromReader(System.Data.SQLite.SQLiteDataReader reader)
        {
            return new Show((int)reader["id"], 
                (string)reader["uri"], 
                (string)reader["title"], 
                null,
                (string)reader["overview"],
                Status.Finished, 
                (int)reader["startYear"], 
                (int)reader["endYear"],
                (string)reader["imgPrimary"],
                (string)reader["imgThumb"],
                (string)reader["imgBanner"],
                (string)reader["imgLogo"],
                (string)reader["imgBackdrop"],
                (string)reader["externalIDs"]);
        }
    }

    public enum Status { Finished, Airing }
}
