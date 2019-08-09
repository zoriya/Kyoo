using Kyoo.Models;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using System.Data.SQLite;
using System.Diagnostics;
using System.IO;

namespace Kyoo.InternalAPI
{
    public class LibraryManager : ILibraryManager
    {
        private readonly SQLiteConnection sqlConnection;


        public LibraryManager(IConfiguration configuration)
        {
            string databasePath = configuration.GetValue<string>("databasePath");

            Debug.WriteLine("&Library Manager init, databasePath: " + databasePath);
            if (!File.Exists(databasePath))
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
					    genres TEXT, 
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
					    FOREIGN KEY(showID) REFERENCES shows(id)
				    );
				    CREATE TABLE episodes(
					    id INTEGER PRIMARY KEY UNIQUE, 
					    showID INTEGER, 
					    seasonID INTEGER, 
					    episodeNumber INTEGER, 
					    path TEXT, 
					    title TEXT, 
					    overview TEXT, 
					    imgPrimary TEXT, 
					    releaseDate TEXT,  
					    runtime INTEGER, 
					    externalIDs TEXT, 
					    FOREIGN KEY(showID) REFERENCES shows(id), 
					    FOREIGN KEY(seasonID) REFERENCES seasons(id)
				    );
				    CREATE TABLE streams(
					    id INTEGER PRIMARY KEY UNIQUE, 
					    episodeID INTEGER, 
					    streamIndex INTEGER, 
					    streamType TEXT,
					    codec TEXT, 
					    language TEXT, 
					    channelLayout TEXT, 
					    profile TEXT, 
					    aspectRatio TEXT, 
					    bitRate INTEGER, 
					    sampleRate INTEGER, 
					    isDefault BOOLEAN, 
					    isForced BOOLEAN, 
					    isExternal BOOLEAN, 
					    height INTEGER, 
					    width INTEGER, 
					    frameRate NUMBER, 
					    level NUMBER, 
					    pixelFormat TEXT, 
					    bitDepth INTEGER, 
					    FOREIGN KEY(episodeID) REFERENCES episodes(id)
				    );

				    CREATE TABLE libraries(
					    id INTEGER PRIMARY KEY UNIQUE, 
					    slug TEXT UNIQUE, 
					    name TEXT
				    );
				    CREATE TABLE librariesLinks(
					    librarieID INTEGER, 
					    showID INTEGER, 
					    FOREIGN KEY(librarieID) REFERENCES libraries(id), 
					    FOREIGN KEY(showID) REFERENCES shows(id)
				    );

				    CREATE TABLE studios(
					    id INTEGER PRIMARY KEY UNIQUE, 
					    slug TEXT UNIQUE, 
					    name TEXT
					    );
				    CREATE TABLE studiosLinks(
					    studioID INTEGER, 
					    showID INTEGER, 
					    FOREIGN KEY(studioID) REFERENCES studios(id), 
					    FOREIGN KEY(showID) REFERENCES shows(id)
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
					    FOREIGN KEY(peopleID) REFERENCES people(id), 
					    FOREIGN KEY(showID) REFERENCES shows(id)
				    );

				    CREATE TABLE genres(
					    id INTEGER PRIMARY KEY UNIQUE, 
					    slug TEXT UNIQUE, 
					    name TEXT
				    );
				    CREATE TABLE genresLinks(
					    genreID INTEGER, 
					    showID INTEGER, 
					    FOREIGN KEY(genreID) REFERENCES genres(id), 
					    FOREIGN KEY(showID) REFERENCES shows(id)
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
        public IEnumerable<Show> QueryShows(string selection)
        {
            string query = "SELECT * FROM shows;";

            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                SQLiteDataReader reader = cmd.ExecuteReader();

                List<Show> shows = new List<Show>();

                while (reader.Read())
                    shows.Add(Show.FromReader(reader));

                return shows;
            }
        }
        #endregion

        #region Check if items exists
        public bool IsShowRegistered(string showPath)
        {
            string query = "SELECT 1 FROM shows WHERE path = $path;";
            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$path", showPath);

                return cmd.ExecuteScalar() != null;
            }
        }

        public bool IsShowRegistered(string showPath, out long showID)
        {
            string query = "SELECT 1 FROM shows WHERE path = $path;";
            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$path", showPath);
                showID = cmd.ExecuteScalar() as long? ?? -1;

                return showID != -1;
            }
        }

        public bool IsSeasonRegistered(long showID, long seasonNumber)
        {
            string query = "SELECT 1 FROM seasons WHERE showID = $showID AND seasonNumber = $seasonNumber;";
            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$showID", showID);
                cmd.Parameters.AddWithValue("$seasonNumber", seasonNumber);

                return cmd.ExecuteScalar() != null;
            }
        }

        public bool IsSeasonRegistered(long showID, long seasonNumber, out long seasonID)
        {
            string query = "SELECT 1 FROM seasons WHERE showID = $showID AND seasonNumber = $seasonNumber;";
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
            string query = "SELECT 1 FROM episodes WHERE path = $path;";
            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("$path", episodePath);

                return cmd.ExecuteScalar() != null;
            }
        }
        #endregion

        #region Write Into The Database
        public long RegisterShow(Show show)
        {
            string query = "INSERT INTO shows (slug, title, aliases, path, overview, genres, startYear, endYear, imgPrimary, imgThumb, imgLogo, imgBackdrop, externalIDs) VALUES($slug, $title, $aliases, $path, $overview, $genres, $startYear, $endYear, $imgPrimary, $imgThumb, $imgLogo, $imgBackdrop, $externalIDs);";
            Debug.WriteLine("&SQL QUERY:: " + query);
            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
            {
                cmd.Parameters.AddWithValue("slug", show.Slug);
                cmd.Parameters.AddWithValue("title", show.Title);
                cmd.Parameters.AddWithValue("aliases", show.GetAliases());
                cmd.Parameters.AddWithValue("path", show.Path);
                cmd.Parameters.AddWithValue("overview", show.Overview);
                cmd.Parameters.AddWithValue("genres", show.GetGenres());
                cmd.Parameters.AddWithValue("status", show.Status);
                cmd.Parameters.AddWithValue("startYear", show.StartYear);
                cmd.Parameters.AddWithValue("endYear", show.EndYear);
                cmd.Parameters.AddWithValue("imgPrimary", show.ImgPrimary);
                cmd.Parameters.AddWithValue("imgThumb", show.ImgThumb);
                cmd.Parameters.AddWithValue("imgLogo", show.ImgLogo);
                cmd.Parameters.AddWithValue("imgBackdrop", show.ImgBackdrop);
                cmd.Parameters.AddWithValue("externalIDs", show.ExternalIDs);
                cmd.ExecuteNonQuery();

                cmd.CommandText = "SELECT LAST_INSERT_ROWID()";
                return (long)cmd.ExecuteScalar();
            }
        }

        public long RegisterSeason(Season season)
        {
            string query = "INSERT INTO seasons (showID, seasonNumber, title, overview, year, imgPrimary, externalIDs) VALUES($showID, $seasonNumber, $title, $overview, $year, $imgPrimary, $externalIDs);";
            Debug.WriteLine("&SQL QUERY:: " + query);
            using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
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
        }
        #endregion
    }
}
