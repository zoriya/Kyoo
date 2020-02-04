using Kyoo.Models;
using Kyoo.Models.Watch;
using System;
using System.Collections.Generic;
using System.Data.SQLite;
using System.Linq;

namespace Kyoo.Controllers
{
	public class LibraryManager : ILibraryManager
	{
		private readonly DatabaseContext _database;
		private readonly SQLiteConnection sqlConnection;
		
		
		public LibraryManager(DatabaseContext database)
		{
			_database = database;
		}

		#region Read the database
		public IEnumerable<Library> GetLibraries()
		{
			return _database.Libraries;
		}

		public IEnumerable<string> GetLibrariesPath()
		{
			IEnumerable<string> paths = new List<string>();
			return Enumerable.Aggregate(_database.Libraries, paths, (current, lib) => current.Concat(lib.Paths));
		}

		public string GetShowExternalIDs(long showID)
		{
			return (from show in _database.Shows where show.ID == showID select show.ExternalIDs).FirstOrDefault();
		}


		public (Track video, IEnumerable<Track> audios, IEnumerable<Track> subtitles) GetStreams(long episodeID, string episodeSlug)
		{
			IEnumerable<Track> tracks = _database.Tracks.Where(track => track.EpisodeID == episodeID);
			return ((from track in tracks where track.Type == StreamType.Video select track.SetLink(episodeSlug)).FirstOrDefault(),
				from track in tracks where track.Type == StreamType.Audio select track.SetLink(episodeSlug),
				from track in tracks where track.Type == StreamType.Subtitle select track.SetLink(episodeSlug));
		}

		public Track GetSubtitle(string showSlug, long seasonNumber, long episodeNumber, string languageTag, bool forced)
		{
			long? showID = _database.Shows.FirstOrDefault(x => x.Slug == showSlug)?.ID;
			if (showID == null)
				return null;
			return (from track in _database.Tracks where track.Episode.ShowID == showID 
			                                          && track.Episode.SeasonNumber == seasonNumber 
			                                          && track.Episode.EpisodeNumber == episodeNumber
			                                          && track.Language == languageTag select track).FirstOrDefault();
		}


		public Library GetLibrary(string librarySlug)
		{
			return (from library in _database.Libraries where library.Slug == librarySlug select library).FirstOrDefault();
		}

		public IEnumerable<Show> GetShows()
		{
			return (from show in _database.Shows join link in _database.CollectionLinks on show equals link.Show into gj
				from l in gj.DefaultIfEmpty()
				where l.CollectionID == null select l.Show).Union(
				from collection in _database.Collections select collection.AsShow()).OrderBy(x => x.Title);
		}

		public IEnumerable<Show> GetShows(string searchQuery)
		{
			return (from show in _database.Shows join link in _database.CollectionLinks on show equals link.Show into gj
				from l in gj.DefaultIfEmpty()
				where l.CollectionID == null select l.Show).Union(
				from collection in _database.Collections select collection.AsShow())
				.Where(x => x.Title.Contains(searchQuery)).OrderBy(x => x.Title);
		}

		public Show GetShowBySlug(string slug)
		{
			return (from show in _database.Shows where show.Slug == slug select show).FirstOrDefault();
		}

		public IEnumerable<Season> GetSeasons(long showID)
		{
			return from season in _database.Seasons where season.ShowID == showID select season;
		}

		public Season GetSeason(string showSlug, long seasonNumber)
		{
			return (from season in _database.Seasons
				where season.SeasonNumber == seasonNumber
				      && season.Show.Slug == showSlug
				select season).FirstOrDefault();
		}

		public int GetSeasonCount(string showSlug, long seasonNumber)
		{
			return (from season in _database.Seasons
				where season.SeasonNumber == seasonNumber
				      && season.Show.Slug == showSlug
				select season).FirstOrDefault()?.Episodes.Count() ?? 0;
		}

		public IEnumerable<Episode> GetEpisodes(string showSlug)
		{
			return from episode in _database.Episodes where episode.Show.Slug == showSlug select episode;
		}

		public IEnumerable<Episode> GetEpisodes(string showSlug, long seasonNumber)
		{
			return from episode in _database.Episodes where episode.SeasonNumber == seasonNumber 
			                                             && episode.Show.Slug == showSlug select episode;
		}

		public IEnumerable<Episode> GetEpisodes(long showID, long seasonNumber)
		{
			return from episode in _database.Episodes where episode.ShowID == showID 
			                                                && episode.SeasonNumber == seasonNumber select episode;
		}

		public Episode GetEpisode(string showSlug, long seasonNumber, long episodeNumber)
		{
			return (from episode in _database.Episodes where episode.EpisodeNumber == episodeNumber
															&& episode.SeasonNumber == seasonNumber 
			                                                && episode.Show.Slug == showSlug select episode).FirstOrDefault();
		}

		public WatchItem GetWatchItem(string showSlug, long seasonNumber, long episodeNumber, bool complete = true)
		{
			WatchItem item = (from episode in _database.Episodes where episode.SeasonNumber == seasonNumber 
               && episode.EpisodeNumber == episodeNumber && episode.Show.Slug == showSlug 
				select new WatchItem(episode.Id, 
					episode.Show.Title,
					episode.Show.Slug,
					seasonNumber,
					episodeNumber,
					episode.Title,
					episode.ReleaseDate,
					episode.Path)).FirstOrDefault();
			if (item == null)
				return null;
			
			(item.Video, item.Audios, item.Subtitles) = GetStreams(item.EpisodeID, item.Link);
			if(episodeNumber > 1)
				item.PreviousEpisode = showSlug + "-s" + seasonNumber + "e" + (episodeNumber - 1);
			else if(seasonNumber > 1)
				item.PreviousEpisode = showSlug + "-s" + (seasonNumber - 1) + "e" + GetSeasonCount(showSlug, seasonNumber - 1);
			
			if (episodeNumber >= GetSeasonCount(showSlug, seasonNumber))
				item.NextEpisode = GetEpisode(showSlug, seasonNumber + 1, 1);
			else
				item.NextEpisode = GetEpisode(showSlug, seasonNumber, episodeNumber + 1);
			return item;
		}

		public IEnumerable<People> GetPeople(long showID)
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

		public IEnumerable<Genre> GetGenreForShow(long showID)
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

		public IEnumerable<People> GetDirectors(long showID)
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
			string query = "SELECT * FROM shows JOIN collectionsLinks l ON l.showID = shows.id WHERE l.collectionID = $id ORDER BY title;";

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

		public IEnumerable<Show> GetShowsInLibrary(long libraryID)
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
			string query = "SELECT * FROM shows JOIN peopleLinks l ON l.showID = shows.id WHERE l.peopleID = $id ORDER BY title;";

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

		public IEnumerable<Episode> SearchEpisodes(string searchQuery)
		{
			List<Episode> episodes = new List<Episode>();
			SQLiteDataReader reader;
			string query = "SELECT episodes.*, shows.slug, shows.title as showTitle FROM episodes JOIN shows ON showID = shows.id WHERE episodes.title LIKE $query ORDER BY seasonNumber, episodeNumber LIMIT 20;";

			using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
			{
				cmd.Parameters.AddWithValue("$query", "%" + searchQuery + "%");
				reader = cmd.ExecuteReader();
				while (reader.Read())
					episodes.Add(Episode.FromReader(reader).SetThumb(reader["slug"] as string).SetShowTitle(reader["showTitle"] as string));
			}
			return episodes;
		}
		
		public IEnumerable<People> SearchPeople(string searchQuery)
		{
			List<People> people = new List<People>();
			SQLiteDataReader reader;
			string query = "SELECT * FROM people WHERE name LIKE $query ORDER BY name LIMIT 40;";

			using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
			{
				cmd.Parameters.AddWithValue("$query", "%" + searchQuery + "%");
				reader = cmd.ExecuteReader();
				while (reader.Read())
					people.Add(People.FromReader(reader));
			}
			return people;
		}
		
		public IEnumerable<Genre> SearchGenres(string searchQuery)
		{
			List<Genre> genres = new List<Genre>();
			SQLiteDataReader reader;
			string query = "SELECT * FROM genres WHERE name LIKE $query ORDER BY name;";

			using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
			{
				cmd.Parameters.AddWithValue("$query", "%" + searchQuery + "%");
				reader = cmd.ExecuteReader();
				while (reader.Read())
					genres.Add(Genre.FromReader(reader));
			}
			return genres;
		}
		
		public IEnumerable<Studio> SearchStudios(string searchQuery)
		{
			List<Studio> studios = new List<Studio>();
			SQLiteDataReader reader;
			string query = "SELECT * FROM studios WHERE name LIKE $query ORDER BY name;";

			using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
			{
				cmd.Parameters.AddWithValue("$query", "%" + searchQuery + "%");
				reader = cmd.ExecuteReader();
				while (reader.Read())
					studios.Add(Studio.FromReader(reader));
			}
			return studios;
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
				return existingGenre.Id;

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
				return existingStudio.ID;

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
			People existingPeople = GetPeopleBySlug(people.Slug);

			if (existingPeople != null)
				return existingPeople.ID;

			string query = "INSERT INTO people (slug, name, imgPrimary, externalIDs) VALUES($slug, $name, $imgPrimary, $externalIDs);";
			using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
			{
				try
				{
					cmd.Parameters.AddWithValue("$slug", people.Slug);
					cmd.Parameters.AddWithValue("$name", people.Name);
					cmd.Parameters.AddWithValue("$imgPrimary", people.ImgPrimary);
					cmd.Parameters.AddWithValue("$externalIDs", people.ExternalIDs);
					cmd.ExecuteNonQuery();

					cmd.CommandText = "SELECT LAST_INSERT_ROWID()";
					return (long)cmd.ExecuteScalar();
				}
				catch
				{
					Console.Error.WriteLine("SQL error while trying to insert a people ({0}).", people.Name);
					cmd.CommandText = "SELECT * FROM people WHERE slug = $slug";
					cmd.Parameters.AddWithValue("$slug", people.Slug);
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

		public void RegisterInLibrary(long showID, Library library)
		{
			string query =
				"INSERT INTO librariesLinks (libraryID, showID) SELECT id, $showID FROM libraries WHERE libraries.id = $libraryID;";

			using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
			{
				cmd.Parameters.AddWithValue("$libraryID", library.Id);
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

					if (show.Studio != null)
					{
						cmd.CommandText = "INSERT INTO studiosLinks (studioID, showID) VALUES($studioID, $showID);";
						long studioID = GetOrCreateStudio(show.Studio);
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
					cmd.Parameters.AddWithValue("$seasonNumber", season.SeasonNumber);
					cmd.Parameters.AddWithValue("$title", season.Title);
					cmd.Parameters.AddWithValue("$overview", season.Overview);
					cmd.Parameters.AddWithValue("$year", season.Year);
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
					cmd.Parameters.AddWithValue("$seasonNumber", season.SeasonNumber);
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
					cmd.Parameters.AddWithValue("$seasonNUmber", episode.SeasonNumber);
					cmd.Parameters.AddWithValue("$episodeNumber", episode.EpisodeNumber);
					cmd.Parameters.AddWithValue("$absoluteNumber", episode.AbsoluteNumber);
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
					cmd.Parameters.AddWithValue("$seasonNumber", episode.SeasonNumber);
					cmd.Parameters.AddWithValue("$episodeNumber", episode.EpisodeNumber);
					return (long)cmd.ExecuteScalar();
				}
			}
		}

		public void RegisterTrack(Track track)
		{
			string query = "INSERT INTO tracks (episodeID, streamType, title, language, codec, isDefault, isForced, isExternal, path) VALUES($episodeID, $streamType, $title, $language, $codec, $isDefault, $isForced, $isExternal, $path);";
			using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
			{
				cmd.Parameters.AddWithValue("$episodeID", track.EpisodeID);
				cmd.Parameters.AddWithValue("$streamType", track.Type);
				cmd.Parameters.AddWithValue("$title", track.Title);
				cmd.Parameters.AddWithValue("$language", track.Language);
				cmd.Parameters.AddWithValue("$codec", track.Codec);
				cmd.Parameters.AddWithValue("$isDefault", track.IsDefault);
				cmd.Parameters.AddWithValue("$isForced", track.IsForced);
				cmd.Parameters.AddWithValue("$isExternal", track.IsExternal);
				cmd.Parameters.AddWithValue("$path", track.Path);
				cmd.ExecuteNonQuery();
			}
		}

		public void RegisterShowPeople(long showID, IEnumerable<People> people)
		{
			if (people == null)
				return;

			string linkQuery = "INSERT INTO peopleLinks (peopleID, showID, role, type) VALUES($peopleID, $showID, $role, $type);";

			foreach (People peop in people)
			{
				using (SQLiteCommand cmd = new SQLiteCommand(linkQuery, sqlConnection))
				{
					cmd.Parameters.AddWithValue("$peopleID", GetOrCreatePeople(peop));
					cmd.Parameters.AddWithValue("$showID", showID);
					cmd.Parameters.AddWithValue("$role", peop.Role);
					cmd.Parameters.AddWithValue("$type", peop.Type);
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
			if (GetSeasons(showID).Count() == 0)
				RemoveShow(showID);
		}

		public void RemoveEpisode(Episode episode)
		{
			string query = "DELETE FROM episodes WHERE id = $episodeID;";

			using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
			{
				cmd.Parameters.AddWithValue("$episodeID", episode.Id);
				cmd.ExecuteNonQuery();
			}

			if (GetEpisodes(episode.ShowID, episode.SeasonNumber).Count() == 0)
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
