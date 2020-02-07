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
				where l.CollectionID == null select l.Show).AsEnumerable().Union(
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
				select new WatchItem(episode.ID, 
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
			return from link in _database.PeopleLinks where link.ShowID == showID select link.People.SetRoleType(link.Role, link.Type);
		}

		public People GetPeopleBySlug(string slug)
		{
			return (from people in _database.Peoples where people.Slug == slug select people).FirstOrDefault();
		}

		public IEnumerable<Genre> GetGenreForShow(long showID)
		{
			return (from show in _database.Shows where show.ID == showID select show.Genres).FirstOrDefault();
		}

		public Genre GetGenreBySlug(string slug)
		{
			return (from genre in _database.Genres where genre.Slug == slug select genre).FirstOrDefault();
		}

		public Studio GetStudio(long showID)
		{
			return (from show in _database.Shows where show.ID == showID select show.Studio).FirstOrDefault();
		}

		public Studio GetStudioBySlug(string slug)
		{
			return (from studio in _database.Studios where studio.Slug == slug select studio).FirstOrDefault();
		}

		public Collection GetCollection(string slug)
		{
			return (from collection in _database.Collections where collection.Slug == slug select collection).FirstOrDefault();
		}

		public IEnumerable<Show> GetShowsInCollection(long collectionID)
		{
			return from link in _database.CollectionLinks where link.CollectionID == collectionID select link.Show;
		}

		public IEnumerable<Show> GetShowsInLibrary(long libraryID)
		{
			return (from link in _database.LibraryLinks where link.LibraryID == libraryID select link).AsEnumerable()
				.Select(link => link.Show ?? link.Collection.AsShow())
				.OrderBy(x => x.Title);
		}

		public IEnumerable<Show> GetShowsByPeople(long peopleID)
		{
			return (from link in _database.PeopleLinks where link.PeopleID == peopleID select link.Show).OrderBy(x => x.Title);
		}

		public IEnumerable<Episode> GetAllEpisodes()
		{
			return _database.Episodes;
		}

		public IEnumerable<Episode> SearchEpisodes(string searchQuery)
		{
			return from episode in _database.Episodes where episode.Title.Contains(searchQuery) select episode;
		}
		
		public IEnumerable<People> SearchPeople(string searchQuery)
		{
			return from people in _database.Peoples where people.Name.Contains(searchQuery) select people;
		}
		
		public IEnumerable<Genre> SearchGenres(string searchQuery)
		{
			return from genre in _database.Genres where genre.Name.Contains(searchQuery) select genre;
		}
		
		public IEnumerable<Studio> SearchStudios(string searchQuery)
		{
			return from studio in _database.Studios where studio.Name.Contains(searchQuery) select studio;
		}
		#endregion

		#region Check if items exists
		public bool IsCollectionRegistered(string collectionSlug, out long collectionID)
		{
			Collection col = (from collection in _database.Collections where collection.Slug == collectionSlug select collection).FirstOrDefault();
			collectionID = col?.ID ?? -1;
			return collectionID != -1;
		}

		public bool IsShowRegistered(string showPath, out long showID)
		{
			Show tmp = (from show in _database.Shows where show.Path == showPath select show).FirstOrDefault();
			showID = tmp?.ID ?? -1;
			return showID != -1;
		}

		public bool IsSeasonRegistered(long showID, long seasonNumber, out long seasonID)
		{
			Season tmp = (from season in _database.Seasons where season.SeasonNumber == seasonNumber && season.ShowID == showID select season).FirstOrDefault();
			seasonID = tmp?.ID ?? -1;
			return seasonID != -1;
		}

		public bool IsEpisodeRegistered(string episodePath, out long episodeID)
		{
			Episode tmp = (from episode in _database.Episodes where episode.Path == episodePath select episode).FirstOrDefault();
			episodeID = tmp?.ID ?? -1;
			return episodeID != -1;
		}

		public long GetOrCreateGenre(Genre genre)
		{
			Genre existingGenre = GetGenreBySlug(genre.Slug);

			if (existingGenre != null)
				return existingGenre.ID;

			_database.Genres.Add(genre);
			_database.SaveChanges();
			return genre.ID;
		}

		public long GetOrCreateStudio(Studio studio)
		{
			Studio existingStudio = GetStudioBySlug(studio.Slug);

			if (existingStudio != null)
				return existingStudio.ID;
			
			_database.Studios.Add(studio);
			_database.SaveChanges();
			return studio.ID;
		}

		public long GetOrCreatePeople(People people)
		{
			People existingPeople = GetPeopleBySlug(people.Slug);

			if (existingPeople != null)
				return existingPeople.ID;

			_database.Peoples.Add(people);
			_database.SaveChanges();
			return people.ID;
		}
		#endregion

		#region Write Into The Database
		public long RegisterCollection(Collection collection)
		{
			// string query = "INSERT INTO collections (slug, name, overview, imgPrimary) VALUES($slug, $name, $overview, $imgPrimary);";
			//
			// using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
			// {
			// 	try
			// 	{
			// 		cmd.Parameters.AddWithValue("$slug", collection.Slug);
			// 		cmd.Parameters.AddWithValue("$name", collection.Name);
			// 		cmd.Parameters.AddWithValue("$overview", collection.Overview);
			// 		cmd.Parameters.AddWithValue("$imgPrimary", collection.ImgPrimary);
			// 		cmd.ExecuteNonQuery();
			//
			// 		cmd.CommandText = "SELECT LAST_INSERT_ROWID()";
			// 		return (long)cmd.ExecuteScalar();
			// 	}
			// 	catch
			// 	{
			// 		Console.Error.WriteLine("SQL error while trying to create a collection. Collection probably already registered.");
			// 		cmd.CommandText = "SELECT * FROM collections WHERE slug = $slug";
			// 		cmd.Parameters.AddWithValue("$slug", collection.Slug);
			// 		return (long)cmd.ExecuteScalar();
			// 	}
			// }
			return -1;
		}

		public void RegisterInLibrary(long showID, Library library)
		{
			// string query =
			// 	"INSERT INTO librariesLinks (libraryID, showID) SELECT id, $showID FROM libraries WHERE libraries.id = $libraryID;";
			//
			// using (SQLiteCommand cmd = new SQLiteCommand(query, sqlConnection))
			// {
			// 	cmd.Parameters.AddWithValue("$libraryID", library.Id);
			// 	cmd.Parameters.AddWithValue("$showID", showID);
			// 	cmd.ExecuteNonQuery();
			// }
		}

		public long RegisterShow(Show show)
		{
			_database.Shows.Add(show);
			_database.SaveChanges();
			return show.ID;
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
				cmd.Parameters.AddWithValue("$episodeID", episode.ID);
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
