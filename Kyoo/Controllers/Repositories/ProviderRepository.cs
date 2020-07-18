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
	public class ProviderRepository : IProviderRepository
	{
		private readonly DatabaseContext _database;


		public ProviderRepository(DatabaseContext database)
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
		
		public async Task<ProviderID> Get(int id)
		{
			return await _database.Providers.FirstOrDefaultAsync(x => x.ID == id);
		}
		
		public async Task<ProviderID> Get(string slug)
		{
			return await _database.Providers.FirstOrDefaultAsync(x => x.Name == slug);
		}

		public async Task<ICollection<ProviderID>> Search(string query)
		{
			return await _database.Providers
				.Where(x => EF.Functions.Like(x.Name, $"%{query}%"))
				.Take(20)
				.ToListAsync();
		}

		public async Task<ICollection<ProviderID>> GetAll(Expression<Func<ProviderID, bool>> where = null, 
			Sort<ProviderID> sort = default,
			Pagination limit = default)
		{
			return await _database.Providers.ToListAsync();
		}

		public async Task<ProviderID> Create(ProviderID obj)
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
					throw new DuplicatedItemException($"Trying to insert a duplicated provider (name {obj.Name} already exists).");
				throw;
			}
			
			return obj;
		}
		
		public async Task<ProviderID> CreateIfNotExists(ProviderID obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			ProviderID old = await Get(obj.Name);
			if (old != null)
				return old;
			try
			{
				return await Create(obj);
			}
			catch (DuplicatedItemException)
			{
				old = await Get(obj.Name);
				if (old == null)
					throw new SystemException("Unknown database state.");
				return old;
			}
		}

		public async Task<ProviderID> Edit(ProviderID edited, bool resetOld)
		{
			if (edited == null)
				throw new ArgumentNullException(nameof(edited));
			
			ProviderID old = await Get(edited.Name);

			if (old == null)
				throw new ItemNotFound($"No provider found with the name {edited.Name}.");
			
			if (resetOld)
				Utility.Nullify(old);
			Utility.Merge(old, edited);
			await _database.SaveChangesAsync();
			return old;
		}

		public async Task Delete(int id)
		{
			ProviderID obj = await Get(id);
			await Delete(obj);
		}

		public async Task Delete(string slug)
		{
			ProviderID obj = await Get(slug);
			await Delete(obj);
		}
		
		public async Task Delete(ProviderID obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			_database.Entry(obj).State = EntityState.Deleted;
			// TODO handle ExternalID deletion when they refer to this providerID.
			await _database.SaveChangesAsync();
		}
		
		public async Task DeleteRange(IEnumerable<ProviderID> objs)
		{
			foreach (ProviderID obj in objs)
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