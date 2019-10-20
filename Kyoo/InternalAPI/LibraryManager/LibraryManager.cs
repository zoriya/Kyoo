using Kyoo.Models;
using Kyoo.Models.Watch;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Data.SQLite;
using System.Diagnostics;

namespace Kyoo.InternalAPI
{
    public class LibraryManager : ILibraryManager
    {
        private readonly SQLiteConnection sqlConnection;


        public LibraryManager(IConfiguration configuration)
        {
            string databasePath = configuration.GetValue<string>("databasePath");

            Debug.WriteLine("&Library Manager init, databasePath: " + databasePath);
            if (!System.IO.File.Exists(databasePath))
            {
                Debug.WriteLine("&Database doesn't exist, creating one.");

                SQLiteConnection.CreateFile(databasePath);
                sqlConnection = new SQLiteConnection(string.Format("Data Source={0};Version=3", databasePath));
                sqlConnection.Open();

                string createStatement = @"CREATE TABLE shows(
					    id INTEGER PRIMARY KEY UNIQUE, 
					    slug TEXT UNIQUE, 
					    title TEXT, 
					    aliases TEXT, 
                        path TEXT UNIQUE,
					    overview TEXT,
					    trailerUrl TEXT,
					    status TEXT, 
					    startYear INTEGER, 
					    endYear INTEGER, 
					    imgPrimary TEXT, 
					    imgThumb TEXT, 
					    imgLogo TEXT, 
					    imgBackdrop TEXT, 
					    externalIDs TEXT
				    );
				    CREATE TABLE seasons(
					    id INTEGER PRIMARY KEY UNIQUE, 
					    showID INTEGER, 
					    seasonNumber INTEGER, 
					    title TEXT, 
					    overview TEXT, 
					    imgPrimary TEXT, 
					    year INTEGER, 
					    externalIDs TEXT, 
					    FOREIGN KEY(showID) REFERENCES shows(id) ON DELETE CASCADE
				    );
				    CREATE TABLE episodes(
					    id INTEGER PRIMARY KEY UNIQUE, 
					    showID INTEGER, 
					    seasonID INTEGER, 
					    seasonNumber INTEGER, 
					    episodeNumber INTEGER, 
					    absoluteNumber INTEGER, 
					    path TEXT UNIQUE, 
					    title TEXT, 
					    overview TEXT, 
					    imgPrimary TEXT, 
					    releaseDate TEXT,  
					    runtime INTEGER, 
					    externalIDs TEXT, 
					    FOREIGN KEY(showID) REFERENCES shows(id) ON DELETE CASCADE, 
					    FOREIGN KEY(seasonID) REFERENCES seasons(id) ON DELETE CASCADE
				    );
				    CREATE TABLE tracks(
					    id INTEGER PRIMARY KEY UNIQUE, 
					    episodeID INTEGER, 
					    streamType INTEGER,
                        title TEXT,
					    language TEXT, 
                        codec TEXT, 
					    isDefault BOOLEAN, 
					    isForced BOOLEAN, 
					    isExternal BOOLEAN,
                        path TEXT,
					    FOREIGN KEY(episodeID) REFERENCES episodes(id) ON DELETE CASCADE
				    );

				    CREATE TABLE libraries(
					    id INTEGER PRIMARY KEY UNIQUE, 
					    slug TEXT UNIQUE, 
					    name TEXT,
					    path TEXT
				    );
				    CREATE TABLE librariesLinks(
					    libraryID INTEGER, 
					    showID INTEGER, 
					    FOREIGN KEY(libraryID) REFERENCES libraries(id) ON DELETE CASCADE, 
					    FOREIGN KEY(showID) REFERENCES shows(id) ON DELETE CASCADE
				    );

                    CREATE TABLE collections(
					    id INTEGER PRIMARY KEY UNIQUE, 
					    slug TEXT UNIQUE,
					    name TEXT,
                        overview TEXT,
                        startYear INTEGER,
                        endYear INTEGER,
                        imgPrimary TEXT
				    );
				    CREATE TABLE collectionsLinks(
					    collectionID INTEGER, 
					    showID INTEGER, 
					    FOREIGN KEY(collectionID) REFERENCES collections(id) ON DELETE CASCADE, 
					    FOREIGN KEY(showID) REFERENCES shows(id) ON DELETE CASCADE
				    );

				    CREATE TABLE studios(
					    id INTEGER PRIMARY KEY UNIQUE, 
					    slug TEXT UNIQUE, 
					    name TEXT
					    );
				    CREATE TABLE studiosLinks(
					    studioID INTEGER, 
					    showID INTEGER, 
					    FOREIGN KEY(studioID) REFERENCES studios(id) ON DELETE CASCADE, 
					    FOREIGN KEY(showID) REFERENCES shows(id) ON DELETE CASCADE
				    );

				    CREATE TABLE people(
					    id INTEGER PRIMARY KEY UNIQUE, 
					    slug TEXT UNIQUE, 
					    name TEXT, 
					    imgPrimary TEXT, 
					    externalIDs TEXT
				    );
				    CREATE TABLE peopleLinks(
					    peopleID INTEGER, 
					    showID INTEGER, 
					    role TEXT, 
					    type TEXT, 
					    FOREIGN KEY(peopleID) REFERENCES people(id) ON DELETE CASCADE, 
					    FOREIGN KEY(showID) REFERENCES shows(id) ON DELETE CASCADE
				    );

				    CREATE TABLE genres(
					    id INTEGER PRIMARY KEY UNIQUE, 
					    slug TEXT UNIQUE, 
					    name TEXT
				    );
				    CREATE TABLE genresLinks(
					    genreID INTEGER, 
					    showID INTEGER, 
					    FOREIGN KEY(genreID) REFERENCES genres(id) ON DELETE CASCADE, 
					    FOREIGN KEY(showID) REFERENCES shows(id) ON DELETE CASCADE
				    );";

                using (SQLiteCommand createCmd = new SQLiteCommand(createStatement, sqlConnection))
                {
                    createCmd.ExecuteNonQuery();
                }
            }
            else
            {
                sqlConnection = new SQLiteConnection(string.Format("Data Source={0};Version=3", databasePath));
                sqlConnection.Open();
            }

            Debug.WriteLine("&Sql Database initated.");
        }

        ~LibraryManager()
        {
            sqlConnection.Close();
        }

        #region Read the database
        public IEnumerable<Library> GetLibraries()
        {
            string query = "SELECT * FROM libraries;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                SQLiteDataReader reader = cmd.ExecuteReader();

                List<Library> libraries = new List<Library>();

                while (reader.Read())
                    libraries.Add(Library.FromReader(reader));

                return libraries;
            }
        }

        public IEnumerable<string> GetLibrariesPath()
        {
            string query = "SELECT path FROM libraries;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                SQLiteDataReader reader = cmd.ExecuteReader();

                List<string> libraries = new List<string>();

                while (reader.Read())
                    libraries.Add(reader["path"] as string);

                return libraries;
            }
        }

        public string GetShowExternalIDs(long showID)
        {
            string query = string.Format("SELECT * FROM shows WHERE id = {0};", showID);

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                SQLiteDataReader reader = cmd.ExecuteReader();

                if (reader.Read())
                    return Show.FromReader(reader).ExternalIDs;
                else
                    return null;
            }
        }


        public (List<Track> audios, List<Track> subtitles) GetStreams(long episodeID, string episodeSlug)
        {
            string query = "SELECT * FROM tracks WHERE episodeID = $episodeID;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$episodeID", episodeID);
                SQLiteDataReader reader = cmd.ExecuteReader();

                List<Track> audios = new List<Track>();
                List<Track> subtitles = new List<Track>();

                while (reader.Read())
                {
                    Track track = Track.FromReader(reader).SetLink(episodeSlug);

                    if (track.type == StreamType.Audio)
                        audios.Add(track);
                    else if (track.type == StreamType.Subtitle)
                        subtitles.Add(track);
                }

                return (audios, subtitles);
            }
        }

        public Track GetSubtitle(string showSlug, long seasonNumber, long episodeNumber, string languageTag, bool forced)
        {
            string query = "SELECT tracks.* FROM tracks JOIN episodes ON tracks.episodeID = episodes.id JOIN shows ON episodes.showID = shows.id WHERE shows.slug = $showSlug AND episodes.seasonNumber = $seasonNumber AND episodes.episodeNumber = $episodeNumber AND tracks.language = $languageTag AND tracks.isForced = $forced;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$showSlug", showSlug);
                cmd.Parameters.AddWithValue("$seasonNumber", seasonNumber);
                cmd.Parameters.AddWithValue("$episodeNumber", episodeNumber);
                cmd.Parameters.AddWithValue("$languageTag", languageTag);
                cmd.Parameters.AddWithValue("$forced", forced);
                SQLiteDataReader reader = cmd.ExecuteReader();

                if (reader.Read())
                    return Track.FromReader(reader).SetLink(Episode.GetSlug(showSlug, seasonNumber, episodeNumber));

                return null;
            }
        }


        public Library GetLibrary(string librarySlug)
        {
            string query = "SELECT * FROM libraries WHERE slug = $slug;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$slug", librarySlug);
                SQLiteDataReader reader = cmd.ExecuteReader();

                if (reader.Read())
                    return Library.FromReader(reader);
                else
                    return null;
            }
        }

        public IEnumerable<Show> GetShows()
        {
            List<Show> shows = new List<Show>();
            SQLiteDataReader reader;
            string query = "SELECT slug, title, startYear, endYear, '0' FROM shows LEFT JOIN collectionsLinks l ON l.showID = shows.id WHERE l.showID IS NULL UNION SELECT slug, name, startYear, endYear, '1' FROM collections ORDER BY title;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                reader = cmd.ExecuteReader();
                while (reader.Read())
                    shows.Add(Show.FromQueryReader(reader));
            }
            return shows;
        }

        public Show GetShowBySlug(string slug)
        {
            string query = "SELECT * FROM shows WHERE slug = $slug;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$slug", slug);
                SQLiteDataReader reader = cmd.ExecuteReader();

                if (reader.Read())
                    return Show.FromReader(reader).SetGenres(this).SetStudio(this).SetDirectors(this).SetSeasons(this).SetPeople(this);
                else
                    return null;
            }
        }

        public List<Season> GetSeasons(long showID)
        {
            string query = "SELECT * FROM seasons WHERE showID = $showID ORDER BY seasonNumber;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$showID", showID);
                SQLiteDataReader reader = cmd.ExecuteReader();

                List<Season> seasons = new List<Season>();

                while (reader.Read())
                    seasons.Add(Season.FromReader(reader));

                return seasons;
            }
        }

        public Season GetSeason(string showSlug, long seasonNumber)
        {
            string query = "SELECT * FROM seasons JOIN shows ON shows.id = seasons.showID WHERE shows.slug = $showSlug AND seasons.seasonNumber = $seasonNumber;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$showSlug", showSlug);
                cmd.Parameters.AddWithValue("$seasonNumber", seasonNumber);
                SQLiteDataReader reader = cmd.ExecuteReader();

                if (reader.Read())
                    return Season.FromReader(reader);
                else
                    return null;
            }
        }

        public int GetSeasonCount(string showSlug, long seasonNumber)
        {
            string query = "SELECT count(episodes.id) FROM episodes JOIN shows ON shows.id = episodes.showID WHERE shows.slug = $showSlug AND episodes.seasonNumber = $seasonNumber;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$showSlug", showSlug);
                cmd.Parameters.AddWithValue("$seasonNumber", seasonNumber);

                int count = Convert.ToInt32(cmd.ExecuteScalar());
                return count;
            }
        }

        public List<Episode> GetEpisodes(string showSlug)
        {
            string query = "SELECT * FROM episodes JOIN shows ON shows.id = episodes.showID WHERE shows.slug = $showSlug ORDER BY episodeNumber;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$showSlug", showSlug);
                SQLiteDataReader reader = cmd.ExecuteReader();

                List<Episode> episodes = new List<Episode>();

                while (reader.Read())
                    episodes.Add(Episode.FromReader(reader).SetThumb(showSlug));

                return episodes;
            }
        }

        public List<Episode> GetEpisodes(string showSlug, long seasonNumber)
        {
            string query = "SELECT * FROM episodes JOIN shows ON shows.id = episodes.showID WHERE shows.slug = $showSlug AND episodes.seasonNumber = $seasonNumber ORDER BY episodeNumber;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$showSlug", showSlug);
                cmd.Parameters.AddWithValue("$seasonNumber", seasonNumber);
                SQLiteDataReader reader = cmd.ExecuteReader();

                List<Episode> episodes = new List<Episode>();

                while (reader.Read())
                    episodes.Add(Episode.FromReader(reader).SetThumb(showSlug));

                return episodes;
            }
        }

        public List<Episode> GetEpisodes(long showID, long seasonNumber)
        {
            string query = "SELECT * FROM episodes WHERE episodes.showID = $showID AND episodes.seasonNumber = $seasonNumber ORDER BY episodeNumber;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$showID", showID);
                cmd.Parameters.AddWithValue("$seasonNumber", seasonNumber);
                SQLiteDataReader reader = cmd.ExecuteReader();

                List<Episode> episodes = new List<Episode>();

                while (reader.Read())
                    episodes.Add(Episode.FromReader(reader));

                return episodes;
            }
        }

        public Episode GetEpisode(string showSlug, long seasonNumber, long episodeNumber)
        {
            string query = "SELECT * FROM episodes JOIN shows ON shows.id = episodes.showID WHERE shows.slug = $showSlug AND episodes.seasonNumber = $seasonNumber AND episodes.episodeNumber = $episodeNumber;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$showSlug", showSlug);
                cmd.Parameters.AddWithValue("$seasonNumber", seasonNumber);
                cmd.Parameters.AddWithValue("$episodeNumber", episodeNumber);
                SQLiteDataReader reader = cmd.ExecuteReader();

                if (reader.Read())
                    return Episode.FromReader(reader).SetThumb(showSlug);
                else
                    return null;
            }
        }

        public WatchItem GetWatchItem(string showSlug, long seasonNumber, long episodeNumber, bool complete = true)
        {
            string query = "SELECT episodes.id, shows.title as showTitle, shows.slug as showSlug, seasonNumber, episodeNumber, episodes.title, releaseDate, episodes.path FROM episodes JOIN shows ON shows.id = episodes.showID WHERE shows.slug = $showSlug AND episodes.seasonNumber = $seasonNumber AND episodes.episodeNumber = $episodeNumber;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$showSlug", showSlug);
                cmd.Parameters.AddWithValue("$seasonNumber", seasonNumber);
                cmd.Parameters.AddWithValue("$episodeNumber", episodeNumber);
                SQLiteDataReader reader = cmd.ExecuteReader();

                if (reader.Read())
                {
                    if (complete)
                        return WatchItem.FromReader(reader).SetStreams(this).SetPrevious(this).SetNext(this);
                    else
                        return WatchItem.FromReader(reader);
                }
                else
                    return null;
            }
        }

        public List<People> GetPeople(long showID)
        {
            string query = "SELECT people.id, people.slug, people.name, people.imgPrimary, people.externalIDs, l.role, l.type FROM people JOIN peopleLinks l ON l.peopleID = people.id WHERE l.showID = $showID;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$showID", showID);
                SQLiteDataReader reader = cmd.ExecuteReader();

                List<People> people = new List<People>();

                while (reader.Read())
                    people.Add(People.FromFullReader(reader));

                return people;
            }
        }

        public People GetPeopleBySlug(string slug)
        {
            string query = "SELECT * FROM people WHERE slug = $slug;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$slug", slug);
                SQLiteDataReader reader = cmd.ExecuteReader();

                if (reader.Read())
                    return People.FromReader(reader);
                else
                    return null;
            }
        }

        public List<Genre> GetGenreForShow(long showID)
        {
            string query = "SELECT genres.id, genres.slug, genres.name FROM genres JOIN genresLinks l ON l.genreID = genres.id WHERE l.showID = $showID;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$showID", showID);
                SQLiteDataReader reader = cmd.ExecuteReader();

                List<Genre> genres = new List<Genre>();

                while (reader.Read())
                    genres.Add(Genre.FromReader(reader));

                return genres;
            }
        }

        public Genre GetGenreBySlug(string slug)
        {
            string query = "SELECT * FROM genres WHERE slug = $slug;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$slug", slug);
                SQLiteDataReader reader = cmd.ExecuteReader();

                if (reader.Read())
                    return Genre.FromReader(reader);
                else
                    return null;
            }
        }

        public Studio GetStudio(long showID)
        {
            string query = "SELECT studios.id, studios.slug, studios.name FROM studios JOIN studiosLinks l ON l.studioID = studios.id WHERE l.showID = $showID;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$showID", showID);
                SQLiteDataReader reader = cmd.ExecuteReader();

                if (reader.Read())
                    return Studio.FromReader(reader);
                else
                    return Studio.Default();
            }
        }

        public Studio GetStudioBySlug(string slug)
        {
            string query = "SELECT * FROM studios WHERE slug = $slug;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$slug", slug);
                SQLiteDataReader reader = cmd.ExecuteReader();

                if (reader.Read())
                    return Studio.FromReader(reader);
                else
                    return null;
            }
        }

        public List<People> GetDirectors(long showID)
        {
            return null;
            //string query = "SELECT genres.id, genres.slug, genres.name FROM genres JOIN genresLinks l ON l.genreID = genres.id WHERE l.showID = $showID;";

            //using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            //{
            //    cmd.Parameters.AddWithValue("$showID", showID);
            //    SQLiteDataReader reader = cmd.ExecuteReader();

            //    List<Genre> genres = new List<Genre>();

            //    while (reader.Read())
            //        genres.Add(Genre.FromReader(reader));

            //    return genres;
            //}
        }

        public Collection GetCollection(string slug)
        {
            string query = "SELECT * FROM collections WHERE slug = $slug;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$slug", slug);
                SQLiteDataReader reader = cmd.ExecuteReader();

                if (reader.Read())
                    return Collection.FromReader(reader).SetShows(this);
                else
                    return null;
            }
        }

        public IEnumerable<Show> GetShowsInCollection(long collectionID)
        {
            string query = "SELECT * FROM shows JOIN collectionsLinks l ON l.showID = shows.id WHERE l.collectionID = $id;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$id", collectionID);
                SQLiteDataReader reader = cmd.ExecuteReader();
                List<Show> shows = new List<Show>();
                while (reader.Read())
                    shows.Add(Show.FromReader(reader));

                return shows;
            }
        }

        public List<Show> GetShowsInLibrary(long libraryID)
        {
            List<Show> shows = new List<Show>();
            SQLiteDataReader reader;
            string query = "SELECT id, slug, title, startYear, endYear, '0' FROM (SELECT id, slug, title, startYear, endYear, '0' FROM shows JOIN librariesLinks lb ON lb.showID = id WHERE lb.libraryID = $libraryID) LEFT JOIN collectionsLinks l ON l.showID = id WHERE l.showID IS NULL UNION SELECT id, slug, name, startYear, endYear, '1' FROM collections JOIN collectionsLinks l ON l.collectionID = collections.id JOIN librariesLinks lb ON lb.showID = l.showID WHERE lb.libraryID = $libraryID ORDER BY title;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$libraryID", libraryID);
                reader = cmd.ExecuteReader();
                while (reader.Read())
                    shows.Add(Show.FromQueryReader(reader));
            }
            return shows;
        }

        public IEnumerable<Show> GetShowsByPeople(long peopleID)
        {
            string query = "SELECT * FROM shows JOIN peopleLinks l ON l.showID = shows.id WHERE l.peopleID = $id;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$id", peopleID);
                SQLiteDataReader reader = cmd.ExecuteReader();
                List<Show> shows = new List<Show>();
                while (reader.Read())
                    shows.Add(Show.FromReader(reader));

                return shows;
            }
        }

        public IEnumerable<Episode> GetAllEpisodes()
        {
            List<Episode> episodes = new List<Episode>();
            string query = "SELECT * FROM episodes;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                SQLiteDataReader reader = cmd.ExecuteReader();

                while (reader.Read())
                    episodes.Add(Episode.FromReader(reader));
                return episodes;
            }
        }
        #endregion

        #region Check if items exists
        public bool IsCollectionRegistered(string collectionSlug)
        {
            string query = "SELECT (id) FROM collections WHERE slug = $slug;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$slug", collectionSlug);

                return cmd.ExecuteScalar() != null;
            }
        }

        public bool IsCollectionRegistered(string collectionSlug, out long collectionID)
        {
            string query = "SELECT (id) FROM collections WHERE slug = $slug;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$slug", collectionSlug);
                collectionID = cmd.ExecuteScalar() as long? ?? -1;

                return collectionID != -1;
            }
        }

        public bool IsShowRegistered(string showPath)
        {
            string query = "SELECT (id) FROM shows WHERE path = $path;";
            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$path", showPath);

                return cmd.ExecuteScalar() != null;
            }
        }

        public bool IsShowRegistered(string showPath, out long showID)
        {
            string query = "SELECT (id) FROM shows WHERE path = $path;";
            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$path", showPath);
                showID = cmd.ExecuteScalar() as long? ?? -1;

                return showID != -1;
            }
        }

        public bool IsSeasonRegistered(long showID, long seasonNumber)
        {
            string query = "SELECT (id) FROM seasons WHERE showID = $showID AND seasonNumber = $seasonNumber;";
            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$showID", showID);
                cmd.Parameters.AddWithValue("$seasonNumber", seasonNumber);

                return cmd.ExecuteScalar() != null;
            }
        }

        public bool IsSeasonRegistered(long showID, long seasonNumber, out long seasonID)
        {
            string query = "SELECT (id) FROM seasons WHERE showID = $showID AND seasonNumber = $seasonNumber;";
            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$showID", showID);
                cmd.Parameters.AddWithValue("$seasonNumber", seasonNumber);
                seasonID = cmd.ExecuteScalar() as long? ?? -1;

                return seasonID != -1;
            }
        }

        public bool IsEpisodeRegistered(string episodePath)
        {
            string query = "SELECT (id) FROM episodes WHERE path = $path;";
            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$path", episodePath);

                return cmd.ExecuteScalar() != null;
            }
        }

        public long GetOrCreateGenre(Genre genre)
        {
            Genre existingGenre = GetGenreBySlug(genre.Slug);

            if (existingGenre != null)
                return existingGenre.id;

            string query = "INSERT INTO genres (slug, name) VALUES($slug, $name);";
            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                try
                {
                    cmd.Parameters.AddWithValue("$slug", genre.Slug);
                    cmd.Parameters.AddWithValue("$name", genre.Name);
                    cmd.ExecuteNonQuery();

                    cmd.CommandText = "SELECT LAST_INSERT_ROWID()";
                    return (long)cmd.ExecuteScalar();
                }
                catch
                {
                    Console.Error.WriteLine("SQL error while trying to insert a people ({0}).", genre.Name);
                    cmd.CommandText = "SELECT * FROM genres WHERE slug = $slug";
                    cmd.Parameters.AddWithValue("$slug", genre.Slug);
                    return (long)cmd.ExecuteScalar();
                }
            }
        }

        public long GetOrCreateStudio(Studio studio)
        {
            Studio existingStudio = GetStudioBySlug(studio.Slug);

            if (existingStudio != null)
                return existingStudio.id;

            string query = "INSERT INTO studios (slug, name) VALUES($slug, $name);";
            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                try
                {
                    cmd.Parameters.AddWithValue("$slug", studio.Slug);
                    cmd.Parameters.AddWithValue("$name", studio.Name);
                    cmd.ExecuteNonQuery();

                    cmd.CommandText = "SELECT LAST_INSERT_ROWID()";
                    return (long)cmd.ExecuteScalar();
                }
                catch (SQLiteException)
                {
                    Console.Error.WriteLine("SQL error while trying to insert a studio ({0}).", studio.Name);
                    cmd.CommandText = "SELECT * FROM studios WHERE slug = $slug";
                    cmd.Parameters.AddWithValue("$slug", studio.Slug);
                    return (long)cmd.ExecuteScalar();
                }
            }
        }

        public long GetOrCreatePeople(People people)
        {
            People existingPeople = GetPeopleBySlug(people.slug);

            if (existingPeople != null)
                return existingPeople.id;

            string query = "INSERT INTO people (slug, name, imgPrimary, externalIDs) VALUES($slug, $name, $imgPrimary, $externalIDs);";
            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                try
                {
                    cmd.Parameters.AddWithValue("$slug", people.slug);
                    cmd.Parameters.AddWithValue("$name", people.Name);
                    cmd.Parameters.AddWithValue("$imgPrimary", people.imgPrimary);
                    cmd.Parameters.AddWithValue("$externalIDs", people.externalIDs);
                    cmd.ExecuteNonQuery();

                    cmd.CommandText = "SELECT LAST_INSERT_ROWID()";
                    return (long)cmd.ExecuteScalar();
                }
                catch
                {
                    Console.Error.WriteLine("SQL error while trying to insert a people ({0}).", people.Name);
                    cmd.CommandText = "SELECT * FROM people WHERE slug = $slug";
                    cmd.Parameters.AddWithValue("$slug", people.slug);
                    return (long)cmd.ExecuteScalar();
                }

            }
        }
        #endregion

        #region Write Into The Database
        public long RegisterCollection(Collection collection)
        {
            string query = "INSERT INTO collections (slug, name, overview, imgPrimary) VALUES($slug, $name, $overview, $imgPrimary);";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                try
                {
                    cmd.Parameters.AddWithValue("$slug", collection.Slug);
                    cmd.Parameters.AddWithValue("$name", collection.Name);
                    cmd.Parameters.AddWithValue("$overview", collection.Overview);
                    cmd.Parameters.AddWithValue("$imgPrimary", collection.ImgPrimary);
                    cmd.ExecuteNonQuery();

                    cmd.CommandText = "SELECT LAST_INSERT_ROWID()";
                    return (long)cmd.ExecuteScalar();
                }
                catch
                {
                    Console.Error.WriteLine("SQL error while trying to create a collection. Collection probably already registered.");
                    cmd.CommandText = "SELECT * FROM collections WHERE slug = $slug";
                    cmd.Parameters.AddWithValue("$slug", collection.Slug);
                    return (long)cmd.ExecuteScalar();
                }
            }
        }

        public void RegisterInLibrary(long showID, string libraryPath)
        {
            string query = "INSERT INTO librariesLinks (libraryID, showID) SELECT id, $showID FROM libraries WHERE libraries.path = $libraryPath;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$libraryPath", libraryPath);
                cmd.Parameters.AddWithValue("$showID", showID);
                cmd.ExecuteNonQuery();
            }
        }

        public long RegisterShow(Show show)
        {
            string query = "INSERT INTO shows (slug, title, aliases, path, overview, trailerUrl, startYear, endYear, imgPrimary, imgThumb, imgLogo, imgBackdrop, externalIDs) VALUES($slug, $title, $aliases, $path, $overview, $trailerUrl, $startYear, $endYear, $imgPrimary, $imgThumb, $imgLogo, $imgBackdrop, $externalIDs);";
            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                try
                {
                    cmd.Parameters.AddWithValue("$slug", show.Slug);
                    cmd.Parameters.AddWithValue("$title", show.Title);
                    cmd.Parameters.AddWithValue("$aliases", show.GetAliases());
                    cmd.Parameters.AddWithValue("$path", show.Path);
                    cmd.Parameters.AddWithValue("$overview", show.Overview);
                    cmd.Parameters.AddWithValue("$trailerUrl", show.TrailerUrl);
                    cmd.Parameters.AddWithValue("$status", show.Status);
                    cmd.Parameters.AddWithValue("$startYear", show.StartYear);
                    cmd.Parameters.AddWithValue("$endYear", show.EndYear);
                    cmd.Parameters.AddWithValue("$imgPrimary", show.ImgPrimary);
                    cmd.Parameters.AddWithValue("$imgThumb", show.ImgThumb);
                    cmd.Parameters.AddWithValue("$imgLogo", show.ImgLogo);
                    cmd.Parameters.AddWithValue("$imgBackdrop", show.ImgBackdrop);
                    cmd.Parameters.AddWithValue("$externalIDs", show.ExternalIDs);
                    cmd.ExecuteNonQuery();

                    cmd.CommandText = "SELECT LAST_INSERT_ROWID()";
                    long showID = (long)cmd.ExecuteScalar();

                    if (show.Genres != null)
                    {
                        cmd.CommandText = "INSERT INTO genresLinks (genreID, showID) VALUES($genreID, $showID);";
                        foreach (Genre genre in show.Genres)
                        {
                            long genreID = GetOrCreateGenre(genre);
                            cmd.Parameters.AddWithValue("$genreID", genreID);
                            cmd.Parameters.AddWithValue("$showID", showID);
                            cmd.ExecuteNonQuery();
                        }
                    }

                    if (show.studio != null)
                    {
                        cmd.CommandText = "INSERT INTO studiosLinks (studioID, showID) VALUES($studioID, $showID);";
                        long studioID = GetOrCreateStudio(show.studio);
                        cmd.Parameters.AddWithValue("$studioID", studioID);
                        cmd.Parameters.AddWithValue("$showID", showID);
                        cmd.ExecuteNonQuery();
                    }

                    return showID;
                }
                catch
                {
                    Console.Error.WriteLine("SQL error while trying to insert a show ({0}), show probably already registered.", show.Title);
                    return -1;
                }
            }
        }

        public long RegisterSeason(Season season)
        {
            string query = "INSERT INTO seasons (showID, seasonNumber, title, overview, year, imgPrimary, externalIDs) VALUES($showID, $seasonNumber, $title, $overview, $year, $imgPrimary, $externalIDs);";
            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                try
                {
                    cmd.Parameters.AddWithValue("$showID", season.ShowID);
                    cmd.Parameters.AddWithValue("$seasonNumber", season.seasonNumber);
                    cmd.Parameters.AddWithValue("$title", season.Title);
                    cmd.Parameters.AddWithValue("$overview", season.Overview);
                    cmd.Parameters.AddWithValue("$year", season.year);
                    cmd.Parameters.AddWithValue("$imgPrimary", season.ImgPrimary);
                    cmd.Parameters.AddWithValue("$externalIDs", season.ExternalIDs);
                    cmd.ExecuteNonQuery();

                    cmd.CommandText = "SELECT LAST_INSERT_ROWID()";
                    return (long)cmd.ExecuteScalar();
                }
                catch
                {
                    Console.Error.WriteLine("SQL error while trying to insert a season ({0}), season probably already registered.", season.Title);
                    cmd.CommandText = "SELECT * FROM seasons WHERE showID = $showID AND seasonNumber = $seasonNumber";
                    cmd.Parameters.AddWithValue("$showID", season.ShowID);
                    cmd.Parameters.AddWithValue("$seasonNumber", season.seasonNumber);
                    return (long)cmd.ExecuteScalar();
                }
            }
        }

        public long RegisterEpisode(Episode episode)
        {
            string query = "INSERT INTO episodes (showID, seasonID, seasonNumber, episodeNumber, absoluteNumber, path, title, overview, releaseDate, runtime, imgPrimary, externalIDs) VALUES($showID, $seasonID, $seasonNumber, $episodeNumber, $absoluteNumber, $path, $title, $overview, $releaseDate, $runtime, $imgPrimary, $externalIDs);";
            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                try
                {
                    cmd.Parameters.AddWithValue("$showID", episode.ShowID);
                    cmd.Parameters.AddWithValue("$seasonID", episode.SeasonID);
                    cmd.Parameters.AddWithValue("$seasonNUmber", episode.seasonNumber);
                    cmd.Parameters.AddWithValue("$episodeNumber", episode.episodeNumber);
                    cmd.Parameters.AddWithValue("$absoluteNumber", episode.absoluteNumber);
                    cmd.Parameters.AddWithValue("$path", episode.Path);
                    cmd.Parameters.AddWithValue("$title", episode.Title);
                    cmd.Parameters.AddWithValue("$overview", episode.Overview);
                    cmd.Parameters.AddWithValue("$releaseDate", episode.ReleaseDate);
                    cmd.Parameters.AddWithValue("$runtime", episode.Runtime);
                    cmd.Parameters.AddWithValue("$imgPrimary", episode.ImgPrimary);
                    cmd.Parameters.AddWithValue("$externalIDs", episode.ExternalIDs);
                    cmd.ExecuteNonQuery();

                    cmd.CommandText = "SELECT LAST_INSERT_ROWID()";
                    return (long)cmd.ExecuteScalar();
                }
                catch
                {
                    Console.Error.WriteLine("SQL error while trying to insert an episode ({0}), episode probably already registered.", episode.Link);
                    cmd.CommandText = "SELECT * FROM episodes WHERE showID = $showID AND seasonNumber = $seasonNumber AND episodeNumber = $episodeNumber";
                    cmd.Parameters.AddWithValue("$showID", episode.ShowID);
                    cmd.Parameters.AddWithValue("$seasonNumber", episode.seasonNumber);
                    cmd.Parameters.AddWithValue("$episodeNumber", episode.episodeNumber);
                    return (long)cmd.ExecuteScalar();
                }
            }
        }

        public void RegisterTrack(Track track)
        {
            string query = "INSERT INTO tracks (episodeID, streamType, title, language, codec, isDefault, isForced, isExternal, path) VALUES($episodeID, $streamType, $title, $language, $codec, $isDefault, $isForced, $isExternal, $path);";
            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$episodeID", track.episodeID);
                cmd.Parameters.AddWithValue("$streamType", track.type);
                cmd.Parameters.AddWithValue("$title", track.Title);
                cmd.Parameters.AddWithValue("$language", track.Language);
                cmd.Parameters.AddWithValue("$codec", track.Codec);
                cmd.Parameters.AddWithValue("$isDefault", track.IsDefault);
                cmd.Parameters.AddWithValue("$isForced", track.IsForced);
                cmd.Parameters.AddWithValue("$isExternal", track.IsDefault);
                cmd.Parameters.AddWithValue("$path", track.Path);
                cmd.ExecuteNonQuery();
            }
        }

        public void RegisterShowPeople(long showID, List<People> people)
        {
            if (people == null)
                return;

            string linkQuery = "INSERT INTO peopleLinks (peopleID, showID, role, type) VALUES($peopleID, $showID, $role, $type);";

            for (int i = 0; i < people.Count; i++)
            {
                using (SQLiteCommand cmd = new SQLiteCommand(linkQuery, sqlConnection))
                {
                    cmd.Parameters.AddWithValue("$peopleID", GetOrCreatePeople(people[i]));
                    cmd.Parameters.AddWithValue("$showID", showID);
                    cmd.Parameters.AddWithValue("$role", people[i].Role);
                    cmd.Parameters.AddWithValue("$type", people[i].Type);
                    cmd.ExecuteNonQuery();
                }
            }
        }

        public void AddShowToCollection(long showID, long collectionID)
        {
            string linkQuery = "INSERT INTO collectionsLinks (collectionID, showID) VALUES($collectionID, $showID);";

            using (SQLiteCommand cmd = new SQLiteCommand(linkQuery, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$collectionID", collectionID);
                cmd.Parameters.AddWithValue("$showID", showID);
                cmd.ExecuteNonQuery();
            }
        }

        public void RemoveShow(long showID)
        {
            string query = "DELETE FROM shows WHERE id = $showID;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$showID", showID);
                cmd.ExecuteNonQuery();
            }
        }

        public void RemoveSeason(long showID, long seasonID)
        {
            string query = "DELETE FROM seasons WHERE id = $seasonID;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$seasonID", seasonID);
                cmd.ExecuteNonQuery();
            }
            if (GetSeasons(showID).Count == 0)
                RemoveShow(showID);
        }

        public void RemoveEpisode(Episode episode)
        {
            string query = "DELETE FROM episodes WHERE id = $episodeID;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$episodeID", episode.id);
                cmd.ExecuteNonQuery();
            }

            if (GetEpisodes(episode.ShowID, episode.seasonNumber).Count == 0)
                RemoveSeason(episode.ShowID, episode.SeasonID);
        }

        public void ClearSubtitles(long episodeID)
        {
            string query = "DELETE FROM tracks WHERE episodeID = $episodeID;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$episodeID", episodeID);
                cmd.ExecuteNonQuery();
            }
        }
        #endregion
    }
}
