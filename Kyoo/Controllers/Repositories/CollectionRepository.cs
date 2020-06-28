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
	public class CollectionRepository : ICollectionRepository
	{
		private readonly DatabaseContext _database;


		public CollectionRepository(DatabaseContext database)
		{
			_database = database;
		}
		
		public void Dispose()
		{
			_database.Dispose();
		}

		public ValueTask DisposeAsync()
		{
			return _database.DisposeAsync();
		}
		
		public Task<Collection> Get(int id)
		{
			return _database.Collections.FirstOrDefaultAsync(x => x.ID == id);
		}

		public Task<Collection> Get(string slug)
		{
			return _database.Collections.FirstOrDefaultAsync(x => x.Slug == slug);
		}
		
		public async Task<ICollection<Collection>> Search(string query)
		{
			return await _database.Collections
				.Where(x => EF.Functions.Like(x.Name, $"%{query}%"))
				.Take(20)
				.ToListAsync();
		}

		public async Task<ICollection<Collection>> GetAll(Expression<Func<Collection, bool>> where = null, 
			Sort<Collection> sort = default,
			Pagination page = default)
		{
			IQueryable<Collection> query = _database.Collections;

			if (where != null)
				query = query.Where(where);

			Expression<Func<Collection, object>> sortOrder = sort.Key ?? (x => x.Name);
			query = sort.Descendant ? query.OrderByDescending(sortOrder) : query.OrderBy(sortOrder);
			
			query.Where(x => x.ID )
			
			return await query.ToListAsync();
		}

		public async Task<int> Create(Collection obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			_database.Entry(obj).State = EntityState.Added;
			
			try
			{
				await _database.SaveChangesAsync();
			}
			catch (DbUpdateException ex)
			{
				_database.DiscardChanges();
				if (Helper.IsDuplicateException(ex))
					throw new DuplicatedItemException($"Trying to insert a duplicated collection (slug {obj.Slug} already exists).");
				throw;
			}

			return obj.ID;
		}
		
		public async Task<int> CreateIfNotExists(Collection obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			Collection old = await Get(obj.Slug);
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

		public async Task Edit(Collection edited, bool resetOld)
		{
			if (edited == null)
				throw new ArgumentNullException(nameof(edited));
			
			Collection old = await Get(edited.Slug);

			if (old == null)
				throw new ItemNotFound($"No collection found with the slug {edited.Slug}.");
			
			if (resetOld)
				Utility.Nullify(old);
			Utility.Merge(old, edited);

			await _database.SaveChangesAsync();
		}

		public async Task Delete(int id)
		{
			Collection obj = await Get(id);
			await Delete(obj);
		}

		public async Task Delete(string slug)
		{
			Collection obj = await Get(slug);
			await Delete(obj);
		}

		public async Task Delete(Collection obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			_database.Entry(obj).State = EntityState.Deleted;
			if (obj.Links != null)
				foreach (CollectionLink link in obj.Links)
					_database.Entry(link).State = EntityState.Deleted;
			if (obj.LibraryLinks != null)
				foreach (LibraryLink link in obj.LibraryLinks)
					_database.Entry(link).State = EntityState.Deleted;
			await _database.SaveChangesAsync();
		}

		public async Task DeleteRange(IEnumerable<Collection> objs)
		{
			foreach (Collection obj in objs)
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