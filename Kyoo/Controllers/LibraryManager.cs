using System;
using Kyoo.Models;
using Kyoo.Models.Watch;
using System.Collections.Generic;
using System.Linq;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Controllers
{
	public class LibraryManager : ILibraryManager
	{
		private readonly DatabaseContext _database;
		
		
		public LibraryManager(DatabaseContext database)
		{
			_database = database;
		}

		#region Read the database
		public IEnumerable<Library> GetLibraries()
		{
			return _database.Libraries;
		}

		public Library GetLibraryForShow(string showSlug)
		{
			return _database.LibraryLinks.FirstOrDefault(x => x.Show.Slug == showSlug)?.Library;
		}

		public IEnumerable<string> GetLibrariesPath()
		{
			IEnumerable<string> paths = new List<string>();
			return Enumerable.Aggregate(_database.Libraries, paths, (current, lib) => current.Concat(lib.Paths));
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

		public Track GetSubtitleById(long id)
		{
			return (from track in _database.Tracks where track.ID == id select track).FirstOrDefault();
		}

		public Library GetLibrary(string librarySlug)
		{
			return (from library in _database.Libraries where library.Slug == librarySlug select library).FirstOrDefault();
		}

		public IEnumerable<Show> GetShows()
		{
			return _database.LibraryLinks.AsEnumerable().Select(x => x.Show ?? x.Collection.AsShow())
				.OrderBy(x => x.Title);
		}

		public IEnumerable<Show> SearchShows(string searchQuery)
		{
			return _database.Shows.FromSqlInterpolated($"SELECT * FROM Shows WHERE Shows.Title LIKE {"%" + searchQuery + "%"} OR Shows.Aliases LIKE {"%" + searchQuery + "%"}")
				.OrderBy(x => x.Title).Take(20);
		}

		public Show GetShowBySlug(string slug)
		{
			return _database.Shows.FirstOrDefault(show => show.Slug == slug);
		}
		
		public Show GetShow(string path)
		{
			return (from show in _database.Shows where show.Path == path select show).FirstOrDefault();
		}

		public IEnumerable<Season> GetSeasons(long showID)
		{
			return (from season in _database.Seasons where season.ShowID == showID select season)
				.OrderBy(x => x.SeasonNumber);
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
			return from episode in _database.Episodes where episode.Show.Slug == showSlug select episode.SetLink(showSlug);
		}

		public IEnumerable<Episode> GetEpisodes(string showSlug, long seasonNumber)
		{
			return (from episode in _database.Episodes where episode.SeasonNumber == seasonNumber 
														 && episode.Show.Slug == showSlug select episode)
				.OrderBy(x => x.EpisodeNumber)
				.Select(x => x.SetLink(showSlug));
		}

		public IEnumerable<Episode> GetEpisodes(long showID, long seasonNumber)
		{
			return from episode in _database.Episodes where episode.ShowID == showID 
														 && episode.SeasonNumber == seasonNumber select episode.SetLink(episode.Show.Slug);
		}

		public Episode GetEpisode(string showSlug, long seasonNumber, long episodeNumber)
		{
			return (from episode in _database.Episodes where episode.EpisodeNumber == episodeNumber
															&& episode.SeasonNumber == seasonNumber 
															&& episode.Show.Slug == showSlug select episode.SetLink(showSlug)).FirstOrDefault();
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

		public WatchItem GetMovieWatchItem(string movieSlug)
		{
			Show movie = _database.Shows.FirstOrDefault(x => x.Slug == movieSlug);
			if (movie == null)
				return null;
			Episode episode = _database.Episodes.FirstOrDefault(x => x.ShowID == movie.ID);
			if (episode == null)
				return null;
			WatchItem item = new WatchItem(movie.ID, 
				movie.Title,
				movie.Slug,
				-1, 
				-1, 
				movie.Title,
				null,
				episode.Path);
			item.Link = movie.Slug;
			item.IsMovie = true;
			(item.Video, item.Audios, item.Subtitles) = GetStreams(item.EpisodeID, item.Link);
			return item;
		}

		public IEnumerable<PeopleLink> GetPeople(long showID)
		{
			return from link in _database.PeopleLinks where link.ShowID == showID orderby link.People.ImgPrimary == null, link.Name select link;
		}

		public People GetPeopleBySlug(string slug)
		{
			return (from people in _database.Peoples where people.Slug == slug select people).FirstOrDefault();
		}

		public IEnumerable<Genre> GetGenres()
		{
			return _database.Genres;
		}
		
		public IEnumerable<Genre> GetGenreForShow(long showID)
		{
			return (from show in _database.Shows where show.ID == showID select show.Genres).FirstOrDefault();
		}

		public Genre GetGenreBySlug(string slug)
		{
			return (from genre in _database.Genres where genre.Slug == slug select genre).FirstOrDefault();
		}

		public IEnumerable<Studio> GetStudios()
		{
			return _database.Studios;
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
			Collection collection = _database.Collections.FirstOrDefault(col => col.Slug == slug);
			if (collection != null)
				collection.Shows = GetShowsInCollection(collection.ID);
			return collection;
		}

		public IEnumerable<Show> GetShowsInCollection(long collectionID)
		{
			return from link in _database.CollectionLinks where link.CollectionID == collectionID select link.Show;
		}

		public IEnumerable<Show> GetShowsInLibrary(long libraryID)
		{
			return (from link in _database.LibraryLinks where link.LibraryID == libraryID select link)
				.AsEnumerable()
				.Select(link => link.Show ?? link.Collection.AsShow())
				.OrderBy(x => x.Title);
		}

		public IEnumerable<Show> GetShowsByPeople(string peopleSlug)
		{
			return (from link in _database.PeopleLinks where link.PeopleID == peopleSlug select link.Show).OrderBy(x => x.Title);
		}

		public IEnumerable<Episode> GetAllEpisodes()
		{
			return _database.Episodes;
		}

		public IEnumerable<Episode> SearchEpisodes(string searchQuery)
		{
			return (from episode in _database.Episodes where EF.Functions.Like(episode.Title, $"%{searchQuery}%") 
					select episode.LoadShowDetails())
				.Take(20);
		}
		
		public IEnumerable<Collection> SearchCollections(string searchQuery)
		{
			return (from collection in _database.Collections where EF.Functions.Like(collection.Name, $"%{searchQuery}%") select collection)
				.OrderBy(x => x.Name).Take(20);
		}
		
		public IEnumerable<People> SearchPeople(string searchQuery)
		{
			return (from people in _database.Peoples where EF.Functions.Like(people.Name, $"%{searchQuery}%") select people)
				.OrderBy(x => x.ImgPrimary == null)
				.ThenBy(x => x.Name)
				.Take(20);
		}
		
		public IEnumerable<Genre> SearchGenres(string searchQuery)
		{
			return (from genre in _database.Genres where EF.Functions.Like(genre.Name, $"%{searchQuery}%") select genre)
				.Take(20);
		}
		
		public IEnumerable<Studio> SearchStudios(string searchQuery)
		{
			return (from studio in _database.Studios where EF.Functions.Like(studio.Name, $"%{searchQuery}%") select studio)
				.Take(20);
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
		#endregion

		#region Write Into The Database
		public long RegisterCollection(Collection collection)
		{
			if (collection == null)
				return 0;
			if (_database.Entry(collection).State == EntityState.Detached)
				_database.Collections.Add(collection);
			_database.SaveChanges();
			return collection.ID;
		}

		public long RegisterShow(Show show)
		{
			if (show == null)
				return 0;
			if (!_database.Entry(show).IsKeySet)
				_database.Shows.Add(show);
			_database.SaveChanges();
			return show.ID;
		}

		public long EditShow(Show edited)
		{
			if (edited == null)
				throw new ArgumentNullException(nameof(edited));

			_database.ChangeTracker.LazyLoadingEnabled = false;
			_database.ChangeTracker.AutoDetectChangesEnabled = false;

			try
			{
				Show show = _database.Entry(edited).IsKeySet
					? _database.Shows.Include(x => x.GenreLinks).FirstOrDefault(x => x.ID == edited.ID)
					: _database.Shows.Include(x => x.GenreLinks).FirstOrDefault(x => x.Slug == edited.Slug);

				if (show == null)
					throw new ItemNotFound($"No show could be found with the id {edited.ID} or the slug {edited.Slug}");
				
				Utility.Complete(show, edited);

				if (edited.Studio != null)
				{
					if (edited.Studio.Slug == null)
						edited.Studio.Slug = Utility.ToSlug(edited.Studio.Name);
					Studio tmp = _database.Studios.FirstOrDefault(x => x.Slug == edited.Studio.Slug);
					if (tmp != null)
						show.Studio = tmp;
				}

				show.GenreLinks = edited.GenreLinks?.Select(x =>
				{
					if (x.Genre.Slug == null)
						x.Genre.Slug = Utility.ToSlug(x.Genre.Name);
					x.Genre = _database.Genres.FirstOrDefault(y => y.Slug == x.Genre.Slug) ?? x.Genre;
					x.GenreID = x.Genre.ID;
					return x;
				}).ToList();
				show.People = edited.People?.Select(x =>
				{
					x.People = _database.Peoples.FirstOrDefault(y => y.Slug == x.People.Slug) ?? x.People;
					return x;
				}).ToList();
				show.Seasons = edited.Seasons?.Select(x =>
				{
					return _database.Seasons.FirstOrDefault(y => y.ShowID == x.ShowID
					                                             && y.SeasonNumber == x.SeasonNumber) ?? x;
				}).ToList();
				show.Episodes = edited.Episodes?.Select(x =>
				{
					return _database.Episodes.FirstOrDefault(y => y.ShowID == x.ShowID 
					                                              && y.SeasonNumber == x.SeasonNumber
					                                              && y.EpisodeNumber == x.EpisodeNumber) ?? x;
				}).ToList();

				_database.ChangeTracker.DetectChanges();
				_database.SaveChanges();
			}
			finally
			{
				_database.ChangeTracker.LazyLoadingEnabled = true;
				_database.ChangeTracker.AutoDetectChangesEnabled = true;
			}

			return edited.ID;
		}

		public long RegisterMovie(Episode movie)
		{
			if (movie == null)
				return 0;
			if (_database.Entry(movie).State == EntityState.Detached)
				_database.Episodes.Add(movie);
			_database.SaveChanges();
			return movie.ID;
		}

		public long RegisterSeason(Season season)
		{
			if (season == null)
				return 0;
			if (_database.Entry(season).State == EntityState.Detached)
				_database.Seasons.Add(season);
			_database.SaveChanges();
			return season.ID;
		}

		public long RegisterEpisode(Episode episode)
		{
			if (episode == null)
				return 0;
			if (_database.Entry(episode).State == EntityState.Detached)
				_database.Episodes.Add(episode);
			_database.SaveChanges();
			return episode.ID;
		}

		public long RegisterTrack(Track track)
		{
			_database.Tracks.Add(track);
			_database.SaveChanges();
			return track.ID;
		}

		public void RegisterShowLinks(Library library, Collection collection, Show show)
		{
			if (collection != null)
			{
				_database.LibraryLinks.AddIfNotExist(new LibraryLink {LibraryID = library.ID, CollectionID = collection.ID}, x => x.LibraryID == library.ID && x.CollectionID == collection.ID && x.ShowID == null);
				_database.CollectionLinks.AddIfNotExist(new CollectionLink { CollectionID = collection.ID, ShowID = show.ID}, x => x.CollectionID == collection.ID && x.ShowID == show.ID);
			}
			else
				_database.LibraryLinks.AddIfNotExist(new LibraryLink {LibraryID = library.ID, ShowID = show.ID}, x => x.LibraryID == library.ID && x.CollectionID == null && x.ShowID == show.ID);
			_database.SaveChanges();
		}
		
		public void RemoveShow(long showID)
		{
			_database.Shows.Remove(new Show {ID = showID});
		}

		public void RemoveSeason(long seasonID)
		{
			_database.Seasons.Remove(new Season {ID = seasonID});
		}

		public void RemoveEpisode(long episodeID)
		{
			_database.Episodes.Remove(new Episode {ID = episodeID});
		}

		public void ClearSubtitles(long episodeID)
		{
			_database.Tracks.RemoveRange(_database.Tracks.Where(x => x.EpisodeID == episodeID));
		}
		#endregion
	}
}
