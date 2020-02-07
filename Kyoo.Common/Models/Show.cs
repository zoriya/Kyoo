using System;
using Kyoo.Controllers;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Linq;

namespace Kyoo.Models
{
    public class Show : IMergable<Show>
    {
        [JsonIgnore] public long ID { get; set; }

        public string Slug { get; set; }
        public string Title { get; set; }
        public string[] Aliases { get; set; }
        [JsonIgnore] public string Path { get; set; }
        public string Overview { get; set; }
        public Status? Status { get; set; }
        public string TrailerUrl { get; set; }

        public long? StartYear { get; set; }
        public long? EndYear { get; set; }

        [JsonIgnore] public string ImgPrimary { get; set; }
        [JsonIgnore] public string ImgThumb { get; set; }
        [JsonIgnore] public string ImgLogo { get; set; }
        [JsonIgnore] public string ImgBackdrop { get; set; }

        public string ExternalIDs { get; set; }
        
        public bool IsCollection;

        public IEnumerable<Genre> Genres;
        public virtual Studio Studio { get; set; }
        public virtual IEnumerable<PeopleLink> People { get; set; }
        public virtual IEnumerable<Season> Seasons { get; set; }
        public virtual IEnumerable<Episode> Episodes { get; set; }


        public string GetAliases()
        {
            return Aliases == null ? null : string.Join('|', Aliases);
        }

        public string GetGenres()
        {
            return Genres == null ? null : string.Join('|', Genres);
        }


        public Show() { }

        public Show(long id, string slug, string title, IEnumerable<string> aliases, string path, string overview, string trailerUrl, IEnumerable<Genre> genres, Status? status, long? startYear, long? endYear, string externalIDs)
        {
            ID = id;
            Slug = slug;
            Title = title;
            Aliases = aliases.ToArray();
            Path = path;
            Overview = overview;
            TrailerUrl = trailerUrl;
            Genres = genres;
            Status = status;
            StartYear = startYear;
            EndYear = endYear;
            ExternalIDs = externalIDs;
            IsCollection = false;
        }

        public Show(long id, string slug, string title, IEnumerable<string> aliases, string path, string overview, string trailerUrl, Status? status, long? startYear, long? endYear, string imgPrimary, string imgThumb, string imgLogo, string imgBackdrop, string externalIDs)
        {
            ID = id;
            Slug = slug;
            Title = title;
            Aliases = aliases.ToArray();
            Path = path;
            Overview = overview;
            TrailerUrl = trailerUrl;
            Status = status;
            StartYear = startYear;
            EndYear = endYear;
            ImgPrimary = imgPrimary;
            ImgThumb = imgThumb;
            ImgLogo = imgLogo;
            ImgBackdrop = imgBackdrop;
            ExternalIDs = externalIDs;
            IsCollection = false;
        }

        public static Show FromQueryReader(System.Data.SQLite.SQLiteDataReader reader, bool containsAliases = false)
        {
            Show show = new Show()
            {
                Slug = reader["slug"] as string,
                Title = reader["title"] as string,
                StartYear = reader["startYear"] as long?,
                EndYear = reader["endYear"] as long?,
                IsCollection = reader["'0'"] as string == "1"
            };
            if (containsAliases)
                show.Aliases = (reader["aliases"] as string)?.Split('|');
            return show;
        }

        public static Show FromReader(System.Data.SQLite.SQLiteDataReader reader)
        {
            return new Show((long)reader["id"],
                reader["slug"] as string,
                reader["title"] as string,
                (reader["aliases"] as string)?.Split('|'),
                reader["path"] as string,
                reader["overview"] as string,
                reader["trailerUrl"] as string,
                reader["status"] as Status?,
                reader["startYear"] as long?,
                reader["endYear"] as long?,
                reader["imgPrimary"] as string,
                reader["imgThumb"] as string,
                reader["imgLogo"] as string,
                reader["imgBackdrop"] as string,
                reader["externalIDs"] as string);
        }

        public string GetID(string provider)
        {
            if (ExternalIDs?.Contains(provider) != true)
                return null;
            int startIndex = ExternalIDs.IndexOf(provider, StringComparison.Ordinal) + provider.Length + 1; //The + 1 is for the '='
            if (ExternalIDs.IndexOf('|', startIndex) == -1)
                return ExternalIDs.Substring(startIndex);
            return ExternalIDs.Substring(startIndex, ExternalIDs.IndexOf('|', startIndex) - startIndex);
        }

        public Show Set(string slug, string path)
        {
            Slug = slug;
            Path = path;
            return this;
        }

        public Show SetGenres(ILibraryManager manager)
        {
            Genres = manager.GetGenreForShow(ID);
            return this;
        }

        public Show SetStudio(ILibraryManager manager)
        {
            Studio = manager.GetStudio(ID);
            return this;
        }

        public Show SetDirectors(ILibraryManager manager)
        {
            //Directors = manager.GetDirectors(ID);
            return this;
        }

        public Show SetPeople(ILibraryManager manager)
        {
            //People = manager.GetPeople(ID);
            return this;
        }

        public Show SetSeasons(ILibraryManager manager)
        {
            Seasons = manager.GetSeasons(ID);
            return this;
        }

        public Show Merge(Show other)
        {
            if (other == null)
                return this;
            if (ID == -1)
                ID = other.ID;
            if (Slug == null)
                Slug = other.Slug;
            if (Title == null)
                Title = other.Title;
            if (Aliases == null)
                Aliases = other.Aliases;
            else
                Aliases = Aliases.Concat(other.Aliases).ToArray();
            if (Genres == null)
                Genres = other.Genres;
            else
                Genres = Genres.Concat(other.Genres);
            if (Path == null)
                Path = other.Path;
            if (Overview == null)
                Overview = other.Overview;
            if (TrailerUrl == null)
                TrailerUrl = other.TrailerUrl;
            if (Status == null)
                Status = other.Status;
            if (StartYear == null)
                StartYear = other.StartYear;
            if (EndYear == null)
                EndYear = other.EndYear;
            if (ImgPrimary == null)
                ImgPrimary = other.ImgPrimary;
            if (ImgThumb == null)
                ImgThumb = other.ImgThumb;
            if (ImgLogo == null)
                ImgLogo = other.ImgLogo;
            if (ImgBackdrop == null)
                ImgBackdrop = other.ImgBackdrop;
            ExternalIDs += '|' + other.ExternalIDs;
            return this;
        }
    }

    public enum Status { Finished, Airing }
}
