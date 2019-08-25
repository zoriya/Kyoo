using Kyoo.InternalAPI;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Linq;

namespace Kyoo.Models
{
    public class Show
    {
        [JsonIgnore] public readonly long id = -1;

        public string Slug;
        public string Title;
        public IEnumerable<string> Aliases;
        [JsonIgnore] public string Path;
        public string Overview;
        public IEnumerable<string> Genres;
        public Status? Status;

        public long? StartYear;
        public long? EndYear;

        [JsonIgnore] public string ImgPrimary;
        [JsonIgnore] public string ImgThumb;
        [JsonIgnore] public string ImgLogo;
        [JsonIgnore] public string ImgBackdrop;

        public string ExternalIDs;

        public IEnumerable<People> people; //Used in the rest API excusively.


        public string GetAliases()
        {
            if (Aliases == null)
                return null;

            return string.Join('|', Aliases);
        }

        public string GetGenres()
        {
            if (Genres == null)
                return null;

            return string.Join('|', Genres);
        }


        public Show() { }

        public Show(long id, string slug, string title, IEnumerable<string> aliases, string path, string overview, IEnumerable<string> genres, Status? status, long? startYear, long? endYear, string externalIDs)
        {
            this.id = id;
            Slug = slug;
            Title = title;
            Aliases = aliases;
            Path = path;
            Overview = overview;
            Genres = genres;
            Status = status;
            StartYear = startYear;
            EndYear = endYear;
            ExternalIDs = externalIDs;
        }

        public Show(long id, string slug, string title, IEnumerable<string> aliases, string path, string overview, IEnumerable<string> genres, Status? status, long? startYear, long? endYear, string imgPrimary, string imgThumb, string imgLogo, string imgBackdrop, string externalIDs)
        {
            this.id = id;
            Slug = slug;
            Title = title;
            Aliases = aliases;
            Path = path;
            Overview = overview;
            Genres = genres;
            Status = status;
            StartYear = startYear;
            EndYear = endYear;
            ImgPrimary = imgPrimary;
            ImgThumb = imgThumb;
            ImgLogo = imgLogo;
            ImgBackdrop = imgBackdrop;
            ExternalIDs = externalIDs;
        }

        public static Show FromReader(System.Data.SQLite.SQLiteDataReader reader)
        {
            return new Show((long)reader["id"],
                reader["slug"] as string,
                reader["title"] as string,
                (reader["aliases"] as string)?.Split('|') ?? null,
                reader["path"] as string,
                reader["overview"] as string,
                (reader["genres"] as string)?.Split('|') ?? null,
                reader["status"] as Status?,
                reader["startYear"] as long?, 
                reader["endYear"] as long?,
                reader["imgPrimary"] as string, 
                reader["imgThumb"] as string,
                reader["imgLogo"] as string,
                reader["imgBackdrop"] as string,
                reader["externalIDs"] as string);
        }

        public Show Set(string slug, string path)
        {
            Slug = slug;
            Path = path;
            return this;
        }

        public Show SetPeople(People[] people)
        {
            this.people = people;
            return this;
        }

        public Show SetPeople(ILibraryManager manager)
        {
            people = manager.GetPeople(id);
            return this;
        }
    }

    public enum Status { Finished, Airing }
}
