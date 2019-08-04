using Kyoo.Models;
using System.Collections.Generic;
using System.Data.SQLite;
using System.Diagnostics;
using System.IO;

namespace Kyoo.InternalAPI
{
    public class LibraryManager : ILibraryManager
    {
        private readonly SQLiteConnection sqlConnection;


        public LibraryManager()
        {
            Debug.WriteLine("&Library Manager init");

            string databasePath = @"C://Projects/database.db";
            if (!File.Exists(databasePath))
            {
                SQLiteConnection.CreateFile(databasePath);
                sqlConnection = new SQLiteConnection(string.Format("Data Source={0};Version=3", databasePath));
                sqlConnection.Open();

                string createStatement = @"CREATE TABLE shows(
					    id INTEGER PRIMARY KEY UNIQUE, 
					    uri TEXT UNIQUE, 
					    title TEXT, 
					    aliases TEXT, 
					    overview TEXT, 
					    status TEXT, 
					    startYear INTEGER, 
					    endYear INTEGER, 
					    imgPrimary TEXT, 
					    imgThumb TEXT, 
					    imgBanner TEXT, 
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
					    uri TEXT UNIQUE, 
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
					    uri TEXT UNIQUE, 
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
					    uri TEXT UNIQUE, 
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
					    uri TEXT UNIQUE, 
					    name TEXT
				    );
				    CREATE TABLE genresLinks(
					    genreID INTEGER, 
					    showID INTEGER, 
					    FOREIGN KEY(genreID) REFERENCES genres(id), 
					    FOREIGN KEY(showID) REFERENCES shows(id)
				    );";

                SQLiteCommand createCmd = new SQLiteCommand(createStatement, sqlConnection);
                createCmd.ExecuteNonQuery();
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

        public IEnumerable<Show> QueryShows(string selection)
        {
            string query = "SELECT * FROM shows";

            SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection);
            SQLiteDataReader reader = cmd.ExecuteReader();

            List<Show> shows = new List<Show>();

            while (reader.Read())
                shows.Add(Show.FromReader(reader));

            return shows;
        }
    }
}
