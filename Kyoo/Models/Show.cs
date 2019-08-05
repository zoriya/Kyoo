using System.Collections.Generic;
using System.Linq;

namespace Kyoo.Models
{
    public class Show
    {
        public readonly long id = -1;

        public string Slug;
        public string Title;
        public List<string> Aliases;
        public string Overview;
        public Status? Status;

        public long? StartYear;
        public long? EndYear;

        public string ImgPrimary;
        public string ImgThumb;
        public string ImgBanner;
        public string ImgLogo;
        public string ImgBackdrop;

        public string ExternalIDs;

        public Show() { }

        public Show(long id, string slug, string title, List<string> aliases, string overview, Status? status, long? startYear, long? endYear, string imgPrimary, string imgThumb, string imgBanner, string imgLogo, string imgBackdrop, string externalIDs)
        {
            this.id = id;
            Slug = slug;
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

        public static Show FromReader(System.Data.SQLite.SQLiteDataReader reader)
        {
            return new Show((long)reader["id"],
                reader["slug"] as string,
                reader["title"] as string,
                (reader["aliases"] as string)?.Split('|').ToList() ?? null,
                reader["overview"] as string,
                reader["status"] as Status?,
                reader["startYear"] as long?, 
                reader["endYear"] as long?,
                reader["imgPrimary"] as string, 
                reader["imgThumb"] as string,
                reader["imgBanner"] as string,
                reader["imgLogo"] as string,
                reader["imgBackdrop"] as string,
                reader["externalIDs"] as string);
        }
    }

    public enum Status { Finished, Airing }
}
