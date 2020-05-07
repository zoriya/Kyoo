using System;
using Kyoo.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
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

		#region GetBySlug
		public Library GetLibrary(string librarySlug)
		{
			return _database.Libraries.FirstOrDefault(library => library.Slug == librarySlug);
		}
		
		public Collection GetCollection(string slug)
		{
			return _database.Collections.FirstOrDefault(col => col.Slug == slug);
		}

		public Show GetShow(string slug)
		{
			return _database.Shows.FirstOrDefault(show => show.Slug == slug);
		}
		
		public Episode GetEpisode(string showSlug, long seasonNumber, long episodeNumber)
		{
			return _database.Episodes.FirstOrDefault(x => x.EpisodeNumber == episodeNumber
			                                              && x.SeasonNumber == seasonNumber 
			                                              && x.Show.Slug == showSlug);
		}
		
		public Episode GetMovieEpisode(string movieSlug)
		{
			return _database.Episodes.FirstOrDefault(x => x.Show.Slug == movieSlug);	
		}

		public Genre GetGenre(string slug)
		{
			return _database.Genres.FirstOrDefault(genre => genre.Slug == slug);
		}

		public Studio GetStudio(string slug)
		{
			return _database.Studios.FirstOrDefault(studio => studio.Slug == slug);
		}

		public People GetPeople(string slug)
		{
			return _database.Peoples.FirstOrDefault(people => people.Slug == slug);
		}
		#endregion
		
		#region GetAll
		public IEnumerable<Library> GetLibraries()
		{
			return _database.Libraries;
		}
		
		public IEnumerable<Show> GetShows()
		{
			return _database.LibraryLinks.AsEnumerable().Select(x => x.Show ?? x.Collection.AsShow());
		}
		
		public IEnumerable<Episode> GetEpisodes()
		{
			return _database.Episodes;
		}
		
		public IEnumerable<Genre> GetGenres()
		{
			return _database.Genres;
		}
		
		public IEnumerable<Studio> GetStudios()
		{
			return _database.Studios;
		}
		#endregion
		
		#region GetHelper
		public IEnumerable<string> GetLibrariesPath()
		{
			IEnumerable<string> paths = new List<string>();
			return Enumerable.Aggregate(_database.Libraries, paths, (current, lib) => current.Concat(lib.Paths));
		}
		
		public Show GetShowByPath(string path)
		{
			return _database.Shows.FirstOrDefault(show => show.Path == path);
		}

		public IEnumerable<Episode> GetEpisodes(string showSlug, long seasonNumber)
		{
			return _database.Episodes.Where(x => x.Show.Slug == showSlug && x.SeasonNumber == seasonNumber);
		}
		#endregion

		#region Search
		public IEnumerable<Collection> SearchCollections(string searchQuery)
		{
			return _database.Collections.Where(collection => EF.Functions.Like(collection.Name, $"%{searchQuery}%"))
				.Take(20);
		}
		
		public IEnumerable<Show> SearchShows(string searchQuery)
		{
			return _database.Shows.FromSqlInterpolated($@"SELECT * FROM Shows WHERE Shows.Title LIKE {$"%{searchQuery}%"}
			                                           OR Shows.Aliases LIKE {$"%{searchQuery}%"}").Take(20);
		}
		
		public IEnumerable<Episode> SearchEpisodes(string searchQuery)
		{
			return _database.Episodes.Where(x => EF.Functions.Like(x.Title, $"%{searchQuery}%")).Take(20);
		}

		public IEnumerable<Genre> SearchGenres(string searchQuery)
		{
			return _database.Genres.Where(genre => EF.Functions.Like(genre.Name, $"%{searchQuery}%"))
				.Take(20);
		}
		
		public IEnumerable<Studio> SearchStudios(string searchQuery)
		{
			return _database.Studios.Where(studio => EF.Functions.Like(studio.Name, $"%{searchQuery}%"))
				.Take(20);
		}
		
		public IEnumerable<People> SearchPeople(string searchQuery)
		{
			return _database.Peoples.Where(people => EF.Functions.Like(people.Name, $"%{searchQuery}%"))
				.OrderBy(x => x.ImgPrimary == null)
				.ThenBy(x => x.Name)
				.Take(20);
		}
		#endregion

		#region Register
		public void Register(object obj)
		{
			if (obj == null)
				return;
			_database.Entry(obj).State = EntityState.Added;
		}
		
		public void RegisterShowLinks(Library library, Collection collection, Show show)
		{
			if (collection != null)
			{
				_database.LibraryLinks.AddIfNotExist(new LibraryLink {Library = library, Collection = collection},
					x => x.Library == library && x.Collection == collection && x.ShowID == null);
				_database.CollectionLinks.AddIfNotExist(new CollectionLink { Collection = collection, Show = show},
					x => x.Collection == collection && x.Show == show);
			}
			else
				_database.LibraryLinks.AddIfNotExist(new LibraryLink {Library = library, Show = show},
					x => x.Library == library && x.Collection == null && x.Show == show);
		}
		
		public Task SaveChanges()
		{
			return _database.SaveChangesAsync();
		}
		#endregion

		#region Edit
		public void Edit(Library edited, bool resetOld)
		{
			Edit(() =>
			{
				var query = _database.Libraries
					.Include(x => x.Providers);
				Library old = _database.Entry(edited).IsKeySet
					? query.FirstOrDefault(x => x.ID == edited.ID)
					: query.FirstOrDefault(x => x.Slug == edited.Slug);
				
				if (old == null)
					throw new ItemNotFound($"No library could be found with the id {edited.ID} or the slug {edited.Slug}");
				
				if (resetOld)
					Utility.Nullify(old);
				Utility.Complete(old, edited);
				Validate(old);
			});
		}
		
		public void Edit(Collection edited, bool resetOld)
		{
			Edit(() =>
			{
				var query = _database.Collections;
				Collection old = _database.Entry(edited).IsKeySet
					? query.FirstOrDefault(x => x.ID == edited.ID)
					: query.FirstOrDefault(x => x.Slug == edited.Slug);
				
				if (old == null)
					throw new ItemNotFound($"No collection could be found with the id {edited.ID} or the slug {edited.Slug}");
				
				if (resetOld)
					Utility.Nullify(old);
				Utility.Complete(old, edited);
				Validate(old);
			});
		}
		public void Edit(Show edited, bool resetOld)
		{
			Edit(() =>
			{
				var query = _database.Shows
					.Include(x => x.GenreLinks)
					.Include(x => x.People)
					.Include(x => x.ExternalIDs);
				Show old = _database.Entry(edited).IsKeySet
					? query.FirstOrDefault(x => x.ID == edited.ID)
					: query.FirstOrDefault(x => x.Slug == edited.Slug);

				if (old == null)
					throw new ItemNotFound($"No show could be found with the id {edited.ID} or the slug {edited.Slug}");
				
				if (resetOld)
					Utility.Nullify(old);
				Utility.Complete(old, edited);
				Validate(old);
			});
		}

		public void Edit(Season edited, bool resetOld)
		{
			Edit(() =>
			{
				var query = _database.Seasons
					.Include(x => x.ExternalIDs)
					.Include(x => x.Episodes);
				Season old = _database.Entry(edited).IsKeySet
					? query.FirstOrDefault(x => x.ID == edited.ID)
					: query.FirstOrDefault(x => x.Slug == edited.Slug);

				if (old == null)
					throw new ItemNotFound($"No season could be found with the id {edited.ID} or the slug {edited.Slug}");
				
				if (resetOld)
					Utility.Nullify(old);
				Utility.Complete(old, edited);
				Validate(old);
			});
		}
		
		public void Edit(Episode edited, bool resetOld)
		{
			Edit(() =>
			{
				var query = _database.Episodes
					.Include(x => x.ExternalIDs)
					.Include(x => x.Season)
					.Include(x => x.Tracks);
				Episode old = _database.Entry(edited).IsKeySet
					? query.FirstOrDefault(x => x.ID == edited.ID)
					: query.FirstOrDefault(x => x.Slug == edited.Slug);

				if (old == null)
					throw new ItemNotFound($"No episode could be found with the id {edited.ID} or the slug {edited.Slug}");

				if (resetOld)
					Utility.Nullify(old);
				Utility.Complete(old, edited);
				Validate(old);
			});
		}

		public void Edit(Track edited, bool resetOld)
		{
			Edit(() =>
			{
				Track old = _database.Tracks.FirstOrDefault(x => x.ID == edited.ID);
				
				if (old == null)
					throw new ItemNotFound($"No library track could be found with the id {edited.ID}");
				
				if (resetOld)
					Utility.Nullify(old);
				Utility.Complete(old, edited);
			});
		}
		
		public void Edit(People edited, bool resetOld)
		{
			Edit(() =>
			{
				var query = _database.Peoples
					.Include(x => x.ExternalIDs);
				People old = _database.Entry(edited).IsKeySet
					? query.FirstOrDefault(x => x.ID == edited.ID)
					: query.FirstOrDefault(x => x.Slug == edited.Slug);
				
				if (old == null)
					throw new ItemNotFound($"No people could be found with the id {edited.ID} or the slug {edited.Slug}");
				
				if (resetOld)
					Utility.Nullify(old);
				Utility.Complete(old, edited);
				Validate(old);
			});
		}
		
		public void Edit(Studio edited, bool resetOld)
		{
			Edit(() =>
			{
				var query = _database.Studios;
				Studio old = _database.Entry(edited).IsKeySet
					? query.FirstOrDefault(x => x.ID == edited.ID)
					: query.FirstOrDefault(x => x.Slug == edited.Slug);
				
				if (old == null)
					throw new ItemNotFound($"No studio could be found with the id {edited.ID} or the slug {edited.Slug}");
				
				if (resetOld)
					Utility.Nullify(old);
				Utility.Complete(old, edited);
				Validate(old);
			});
		}
		
		public void Edit(Genre edited, bool resetOld)
		{
			Edit(() =>
			{
				var query = _database.Genres;
				Genre old = _database.Entry(edited).IsKeySet
					? query.FirstOrDefault(x => x.ID == edited.ID)
					: query.FirstOrDefault(x => x.Slug == edited.Slug);
				
				if (old == null)
					throw new ItemNotFound($"No genre could be found with the id {edited.ID} or the slug {edited.Slug}");
				
				if (resetOld)
					Utility.Nullify(old);
				Utility.Complete(old, edited);
				Validate(old);
			});
		}
		
		private void Edit(Action applyFunction)
		{
			_database.ChangeTracker.LazyLoadingEnabled = false;
			_database.ChangeTracker.AutoDetectChangesEnabled = false;

			try
			{
				applyFunction.Invoke();
				
				_database.ChangeTracker.DetectChanges();
				_database.SaveChanges();
			}
			finally
			{
				_database.ChangeTracker.LazyLoadingEnabled = true;
				_database.ChangeTracker.AutoDetectChangesEnabled = true;
			}
		}
		#endregion
		
		#region ValidateValue
		public Library Validate(Library library)
		{
			if (library == null)
				return null;
			library.Providers = library.Providers.Select(x =>
			{
				x.Provider = _database.Providers.FirstOrDefault(y => y.Name == x.Name);
				if (x.Provider != null)
					x.ProviderID = x.Provider.ID;
				return x;
			}).Where(x => x.Provider != null).ToList();
			return library;
		}

		public Collection Validate(Collection collection)
		{
			if (collection == null)
				return null;
			if (collection.Slug == null)
				collection.Slug = Utility.ToSlug(collection.Name);
			return collection;
		}

		public Show Validate(Show show)
		{
			if (show == null)
				return null;
			
			show.Studio = Validate(show.Studio);

			show.GenreLinks = show.GenreLinks?.Select(x =>
			{
				x.Genre = Validate(x.Genre);
				x.GenreID = x.Genre.ID;
				return x;
			}).ToList();
			
			show.People = show.People?.Select(x =>
			{
				x.People = Validate(x.People);
				x.PeopleID = x.People.ID;
				return x;
			}).ToList();
			
			show.Seasons = show.Seasons?.Select(x =>
			{
				return _database.Seasons.FirstOrDefault(y => y.ShowID == x.ShowID
				                                             && y.SeasonNumber == x.SeasonNumber) ?? Validate(x);
			}).ToList();
			show.Episodes = show.Episodes?.Select(x =>
			{
				return _database.Episodes.FirstOrDefault(y => y.ShowID == x.ShowID 
				                                              && y.SeasonNumber == x.SeasonNumber
				                                              && y.EpisodeNumber == x.EpisodeNumber) ?? Validate(x);
			}).ToList();
			
			show.ExternalIDs = Validate(show.ExternalIDs);
			return show;
		}

		public Season Validate(Season season)
		{
			if (season == null)
				return null;
			
			season.Episodes = season.Episodes?.Select(x =>
			{
				return _database.Episodes.FirstOrDefault(y => y.ShowID == x.ShowID 
				                                              && y.SeasonNumber == x.SeasonNumber
				                                              && y.EpisodeNumber == x.EpisodeNumber) ?? Validate(x);
			}).ToList();
			season.ExternalIDs = Validate(season.ExternalIDs);
			return season;
		}

		public Episode Validate(Episode episode)
		{
			if (episode == null)
				return null;
			
			Season old = _database.Seasons.FirstOrDefault(x => x.ShowID == episode.ShowID 
			                                                       && x.SeasonNumber == episode.SeasonNumber);
			if (old != null)
				episode.Season = old;
			else
				episode.Season.ExternalIDs = Validate(episode.Season.ExternalIDs);
			episode.ExternalIDs = Validate(episode.ExternalIDs);
			return episode;
		}

		public Studio Validate(Studio studio)
		{
			if (studio == null)
				return null;
			if (studio.Slug == null)
				studio.Slug = Utility.ToSlug(studio.Name);
			return _database.Studios.FirstOrDefault(x => x.Slug == studio.Slug) ?? studio;
		}

		public People Validate(People people)
		{
			if (people == null)
				return null;
			if (people.Slug == null)
				people.Slug = Utility.ToSlug(people.Name);
			People old = _database.Peoples.FirstOrDefault(y => y.Slug == people.Slug);
			if (old != null)
				return old;
			people.ExternalIDs = Validate(people.ExternalIDs);
			return people;
		}

		public Genre Validate(Genre genre)
		{
			if (genre.Slug == null)
				genre.Slug = Utility.ToSlug(genre.Name);
			return _database.Genres.FirstOrDefault(y => y.Slug == genre.Slug) ?? genre;
		}
		
		public IEnumerable<MetadataID> Validate(IEnumerable<MetadataID> ids)
		{
			return ids?.Select(x =>
			{
				x.Provider = _database.Providers.FirstOrDefault(y => y.Name == x.Provider.Name) ?? x.Provider;
				x.ProviderID = x.Provider.ID;
				return x;
			}).GroupBy(x => x.Provider.Name).Select(x => x.First()).ToList();
		}
		#endregion

		#region Remove
		public void RemoveShow(Show show)
		{
			if (_database.Entry(show).State == EntityState.Detached)
				_database.Shows.Attach(show);
			_database.Shows.Remove(show);
		}

		public void RemoveSeason(Season season)
		{
			if (_database.Entry(season).State == EntityState.Detached)
				_database.Seasons.Attach(season);
			_database.Seasons.Remove(season);
		}

		public void RemoveEpisode(Episode episode)
		{
			if (_database.Entry(episode).State == EntityState.Detached)
				_database.Episodes.Attach(episode);
			_database.Episodes.Remove(episode);
		}
		#endregion
	}
}
