using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace Kyoo.Controllers
{
	public class LibraryManager : ILibraryManager
	{
		private const int MaxSaveRetry = 3;
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

		public Season GetSeason(string showSlug, long seasonNumber)
		{
			return _database.Seasons.FirstOrDefault(x => x.Show.Slug == showSlug && x.SeasonNumber == seasonNumber);
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

		public ProviderID GetProvider(string name)
		{
			return _database.Providers.FirstOrDefault(x => x.Name == name);
		}

		#endregion
		
		#region GetAll
		public IEnumerable<Library> GetLibraries()
		{
			return _database.Libraries;
		}

		public IEnumerable<Collection> GetCollections()
		{
			return _database.Collections;
		}

		public IEnumerable<Show> GetShows()
		{
			return _database.Shows;
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

		public IEnumerable<People> GetPeoples()
		{
			return _database.Peoples;
		}

		public IEnumerable<Track> GetTracks()
		{
			return _database.Tracks;
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
			ValidateRootEntry(_database.Entry(obj), entry =>
			{
				if (entry.State != EntityState.Detached)
					return false;
				
				entry.State = EntityState.Added;
				return true;
			});
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
			return SaveChanges(0);
		}

		private async Task SaveChanges(int retryCount)
		{
			ValidateChanges();
			try
			{
				await _database.SaveChangesAsync();
			}
			catch (DbUpdateException)
			{
				if (retryCount < MaxSaveRetry)
					await SaveChanges(retryCount + 1);
				else
					throw;
			}
		}
		
		public async Task Edit(object obj, bool resetOld)
		{
			_database.ChangeTracker.LazyLoadingEnabled = false;
			_database.ChangeTracker.AutoDetectChangesEnabled = false;

			try
			{
				object existing = FindExisting(obj);
				
				if (existing == null)
					throw new ItemNotFound($"No existing object (of type {obj.GetType().Name}) found on the databse.");

				if (resetOld)
					Utility.Nullify(existing);
				Utility.Merge(existing, obj);
				
				ValidateRootEntry(_database.Entry(existing), entry => entry.State != EntityState.Added);
				
				_database.ChangeTracker.DetectChanges();
				await _database.SaveChangesAsync();
			}
			finally
			{
				_database.ChangeTracker.LazyLoadingEnabled = true;
				_database.ChangeTracker.AutoDetectChangesEnabled = true;
			}
		}
		#endregion
		
		#region ValidateValue
		private void ValidateChanges()
		{
			_database.ChangeTracker.AutoDetectChangesEnabled = false;
			try
			{
				foreach (EntityEntry sourceEntry in _database.ChangeTracker.Entries())
				{
					if (sourceEntry.State != EntityState.Added && sourceEntry.State != EntityState.Modified)
						continue;

					foreach (NavigationEntry navigation in sourceEntry.Navigations)
						ValidateNavigation(navigation);
				}
			}
			finally
			{
				_database.ChangeTracker.AutoDetectChangesEnabled = true;
				_database.ChangeTracker.DetectChanges();
			}
		}
		
		private void ValidateRootEntry(EntityEntry entry, Func<EntityEntry, bool> shouldRun)
		{
			if (!shouldRun.Invoke(entry))
				return;
			foreach (NavigationEntry navigation in entry.Navigations)
			{
				ValidateNavigation(navigation);
				if (navigation.CurrentValue == null)
					continue;
				if (navigation.Metadata.IsCollection())
				{
					IEnumerable entities = (IEnumerable)navigation.CurrentValue;
					foreach (object childEntry in entities)
						ValidateRootEntry(_database.Entry(childEntry), shouldRun);
				}
				else
					ValidateRootEntry(_database.Entry(navigation.CurrentValue), shouldRun);
			}
		}

		private void ValidateNavigation(NavigationEntry navigation)
		{
			object oldValue = navigation.CurrentValue;
			if (oldValue == null)
				return;
			object newValue = Validate(oldValue);
			if (ReferenceEquals(oldValue, newValue))
				return;
			navigation.CurrentValue = newValue;
			if (!navigation.Metadata.IsCollection())
				_database.Entry(oldValue).State = EntityState.Detached;
		}
		
		private T Validate<T>(T obj) where T : class
		{
			switch (obj)
			{
				case null:
					return null;
				case IEnumerable<object> enumerable:
					return (T)Utility.RunGenericMethod(
						this, 
						"ValidateList",
						Utility.GetEnumerableType(enumerable), new [] {obj});
			}

			EntityState state = _database.Entry(obj).State;
			if (state != EntityState.Added && state != EntityState.Detached)
				return obj;

			return (T)(FindExisting(obj) ?? obj);
		}

		public IEnumerable<T> ValidateList<T>(IEnumerable<T> list) where T : class
		{
			return list.Select(x =>
			{
				T tmp = Validate(x);
				if (tmp != x)
					_database.Entry(x).State = EntityState.Detached;
				return tmp ?? x;
			})/*.GroupBy(GetSlug).Select(x => x.First()).Where(x => x != null)*/.ToList();
		}

		private object FindExisting(object obj)
		{
			return obj switch
			{
				Library library => GetLibrary(library.Slug),
				Collection collection => GetCollection(collection.Slug),
				Show show => GetShow(show.Slug),
				Season season => GetSeason(season.Show.Slug, season.SeasonNumber),
				Episode episode => GetEpisode(episode.Show.Slug, episode.SeasonNumber, episode.EpisodeNumber),
				Studio studio => GetStudio(studio.Slug),
				People people => GetPeople(people.Slug),
				Genre genre => GetGenre(genre.Slug),
				ProviderID provider => GetProvider(provider.Name),
				_ => null
			};
		}

		public IEnumerable<MetadataID> Validate(IEnumerable<MetadataID> ids)
		{
			return ids?.Select(x =>
			{
				x.Provider = _database.Providers.FirstOrDefault(y => y.Name == x.Provider.Name) ?? x.Provider;
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
