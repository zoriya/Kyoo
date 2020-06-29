using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Controllers
{
	public class ShowRepository : IShowRepository
	{
		private readonly DatabaseContext _database;
		private readonly IStudioRepository _studios;
		private readonly IPeopleRepository _people;
		private readonly IGenreRepository _genres;
		private readonly IProviderRepository _providers;
		private readonly ISeasonRepository _seasons;
		private readonly IEpisodeRepository _episodes;

		public ShowRepository(DatabaseContext database,
			IStudioRepository studios,
			IPeopleRepository people, 
			IGenreRepository genres, 
			IProviderRepository providers, 
			ISeasonRepository seasons, 
			IEpisodeRepository episodes)
		{
			_database = database;
			_studios = studios;
			_people = people;
			_genres = genres;
			_providers = providers;
			_seasons = seasons;
			_episodes = episodes;
		}
		
		public void Dispose()
		{
			_database.Dispose();
			_studios.Dispose();
		}

		public async ValueTask DisposeAsync()
		{
			await Task.WhenAll(_database.DisposeAsync().AsTask(), _studios.DisposeAsync().AsTask());
		}
		
		public Task<Show> Get(int id)
		{
			return _database.Shows.FirstOrDefaultAsync(x => x.ID == id);
		}
		
		public Task<Show> Get(string slug)
		{
			return _database.Shows.FirstOrDefaultAsync(x => x.Slug == slug);
		}

		public Task<Show> GetByPath(string path)
		{
			return _database.Shows.FirstOrDefaultAsync(x => x.Path == path);
		}

		public async Task<ICollection<Show>> Search(string query)
		{
			return await _database.Shows
				.FromSqlInterpolated($@"SELECT * FROM Shows WHERE 'Shows.Title' LIKE {$"%{query}%"}
			                                           OR 'Shows.Aliases' LIKE {$"%{query}%"}")
				.Take(20)
				.ToListAsync();
		}

		public async Task<ICollection<Show>> GetAll(Expression<Func<Show, bool>> where = null, 
			Sort<Show> sort = default,
			Pagination page = default)
		{
			IQueryable<Show> query = _database.Shows;

			if (where != null)
				query = query.Where(where);

			Expression<Func<Show, object>> sortKey = sort.Key ?? (x => x.Title);
			query = sort.Descendant ? query.OrderByDescending(sortKey) : query.OrderBy(sortKey);

			if (page.AfterID != 0)
			{
				Show after = await Get(page.AfterID);
				object afterObj = sortKey.Compile()(after);
				query = query.Where(Expression.Lambda<Func<Show, bool>>(
					Expression.GreaterThan(sortKey, Expression.Constant(afterObj))
				));
			}
			query = query.Take(page.Count <= 0 ? 20 : page.Count);

			return await query.ToListAsync();
		}

		public async Task<int> Create(Show obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			await Validate(obj);
			_database.Entry(obj).State = EntityState.Added;
			if (obj.GenreLinks != null)
				foreach (GenreLink entry in obj.GenreLinks)
					_database.Entry(entry).State = EntityState.Added;
			if (obj.People != null)
				foreach (PeopleLink entry in obj.People)
					_database.Entry(entry).State = EntityState.Added;
			if (obj.ExternalIDs != null)
				foreach (MetadataID entry in obj.ExternalIDs)
					_database.Entry(entry).State = EntityState.Added;
			
			try
			{
				await _database.SaveChangesAsync();
			}
			catch (DbUpdateException ex)
			{
				_database.DiscardChanges();
				if (Helper.IsDuplicateException(ex))
					throw new DuplicatedItemException($"Trying to insert a duplicated show (slug {obj.Slug} already exists).");
				throw;
			}
			
			return obj.ID;
		}
		
		public async Task<int> CreateIfNotExists(Show obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			Show old = await Get(obj.Slug);
			if (old != null)
				return old.ID;
			try
			{
				return await Create(obj);
			}
			catch (DuplicatedItemException)
			{
				old = await Get(obj.Slug);
				if (old == null)
					throw new SystemException("Unknown database state.");
				return old.ID;
			}
		}

		public async Task Edit(Show edited, bool resetOld)
		{
			if (edited == null)
				throw new ArgumentNullException(nameof(edited));
			
			Show old = await Get(edited.Slug);

			if (old == null)
				throw new ItemNotFound($"No show found with the slug {edited.Slug}.");
			
			if (resetOld)
				Utility.Nullify(old);
			Utility.Merge(old, edited);
			await Validate(old);
			await _database.SaveChangesAsync();
		}

		private async Task Validate(Show obj)
		{
			if (obj.Studio != null)
				obj.StudioID = await _studios.CreateIfNotExists(obj.Studio);
			
			if (obj.GenreLinks != null)
				foreach (GenreLink link in obj.GenreLinks)
					link.GenreID = await _genres.CreateIfNotExists(link.Genre);

			if (obj.People != null)
				foreach (PeopleLink link in obj.People)
					link.PeopleID = await _people.CreateIfNotExists(link.People);

			if (obj.ExternalIDs != null)
				foreach (MetadataID link in obj.ExternalIDs)
					link.ProviderID = await _providers.CreateIfNotExists(link.Provider);
		}
		
		public async Task AddShowLink(int showID, int? libraryID, int? collectionID)
		{
			if (collectionID != null)
			{
				_database.CollectionLinks.AddIfNotExist(new CollectionLink { CollectionID = collectionID, ShowID = showID},
					x => x.CollectionID == collectionID && x.ShowID == showID);
			}
			if (libraryID != null)
			{
				_database.LibraryLinks.AddIfNotExist(new LibraryLink {LibraryID = libraryID.Value, ShowID = showID},
					x => x.LibraryID == libraryID.Value && x.CollectionID == null && x.ShowID == showID);
			}

			if (libraryID != null && collectionID != null)
			{
				_database.LibraryLinks.AddIfNotExist(
					new LibraryLink {LibraryID = libraryID.Value, CollectionID = collectionID.Value},
					x => x.LibraryID == libraryID && x.CollectionID == collectionID && x.ShowID == null);
			}

			await _database.SaveChangesAsync();
		}

		public async Task Delete(int id)
		{
			Show obj = await Get(id);
			await Delete(obj);
		}

		public async Task Delete(string slug)
		{
			Show obj = await Get(slug);
			await Delete(obj);
		}
		
		public async Task Delete(Show obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			_database.Entry(obj).State = EntityState.Deleted;
			
			if (obj.GenreLinks != null)
				foreach (GenreLink entry in obj.GenreLinks)
					_database.Entry(entry).State = EntityState.Deleted;
			
			if (obj.People != null)
				foreach (PeopleLink entry in obj.People)
					_database.Entry(entry).State = EntityState.Deleted;
			
			if (obj.ExternalIDs != null)
				foreach (MetadataID entry in obj.ExternalIDs)
					_database.Entry(entry).State = EntityState.Deleted;
			
			if (obj.CollectionLinks != null)
				foreach (CollectionLink entry in obj.CollectionLinks)
					_database.Entry(entry).State = EntityState.Deleted;
			
			if (obj.LibraryLinks != null)
				foreach (LibraryLink entry in obj.LibraryLinks)
					_database.Entry(entry).State = EntityState.Deleted;
			
			await _database.SaveChangesAsync();

			if (obj.Seasons != null)
				await _seasons.DeleteRange(obj.Seasons);

			if (obj.Episodes != null) 
				await _episodes.DeleteRange(obj.Episodes);
		}
		
		public async Task DeleteRange(IEnumerable<Show> objs)
		{
			foreach (Show obj in objs)
				await Delete(obj);
		}
		
		public async Task DeleteRange(IEnumerable<int> ids)
		{
			foreach (int id in ids)
				await Delete(id);
		}
		
		public async Task DeleteRange(IEnumerable<string> slugs)
		{
			foreach (string slug in slugs)
				await Delete(slug);
		}
	}
}