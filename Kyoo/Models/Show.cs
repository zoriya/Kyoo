﻿using Kyoo.InternalAPI;
using Newtonsoft.Json;
using System.Collections.Generic;

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
        public IEnumerable<Genre> Genres;
        public Status? Status;
        public string TrailerUrl;

        public long? StartYear;
        public long? EndYear;

        [JsonIgnore] public string ImgPrimary;
        [JsonIgnore] public string ImgThumb;
        [JsonIgnore] public string ImgLogo;
        [JsonIgnore] public string ImgBackdrop;

        public string ExternalIDs;

        //Used in the rest API excusively.
        public Studio studio;
        public IEnumerable<People> directors;
        public IEnumerable<People> people;
        public IEnumerable<Season> seasons;
        public bool IsCollection;


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

        public Show(long id, string slug, string title, IEnumerable<string> aliases, string path, string overview, string trailerUrl, IEnumerable<Genre> genres, Status? status, long? startYear, long? endYear, string externalIDs)
        {
            this.id = id;
            Slug = slug;
            Title = title;
            Aliases = aliases;
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
            this.id = id;
            Slug = slug;
            Title = title;
            Aliases = aliases;
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

        public static Show FromQueryReader(System.Data.SQLite.SQLiteDataReader reader)
        {
            return new Show()
            {
                Slug = reader["slug"] as string,
                Title = reader["title"] as string,
                StartYear = reader["startYear"] as long?,
                EndYear = reader["endYear"] as long?,
                IsCollection = reader[4] as string == "1"
            };
        }

        public static Show FromReader(System.Data.SQLite.SQLiteDataReader reader)
        {
            return new Show((long)reader["id"],
                reader["slug"] as string,
                reader["title"] as string,
                (reader["aliases"] as string)?.Split('|') ?? null,
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

        public Show Set(string slug, string path)
        {
            Slug = slug;
            Path = path;
            return this;
        }

        public Show SetGenres(ILibraryManager manager)
        {
            Genres = manager.GetGenreForShow(id);
            return this;
        }

        public Show SetStudio(ILibraryManager manager)
        {
            studio = manager.GetStudio(id);
            return this;
        }

        public Show SetDirectors(ILibraryManager manager)
        {
            directors = manager.GetDirectors(id);
            return this;
        }

        public Show SetPeople(ILibraryManager manager)
        {
            people = manager.GetPeople(id);
            return this;
        }

        public Show SetSeasons(ILibraryManager manager)
        {
            seasons = manager.GetSeasons(id);
            return this;
        }
    }

    public enum Status { Finished, Airing }
}
