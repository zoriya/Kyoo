using System;
using System.Collections.Generic;
using System.Linq;
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

		public async Task<ICollection<ProviderID>> GetAll()
		{
			return await _database.Providers.ToListAsync();
		}

		public async Task<int> Create(ProviderID obj)
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
			
			return obj.ID;
		}
		
		public async Task<int> CreateIfNotExists(ProviderID obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			ProviderID old = await Get(obj.Name);
			if (old != null)
				return old.ID;
			try
			{
				return await Create(obj);
			}
			catch (DuplicatedItemException)
			{
				old = await Get(obj.Name);
				if (old == null)
					throw new SystemException("Unknown database state.");
				return old.ID;
			}
		}

		public async Task Edit(ProviderID edited, bool resetOld)
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
		}

		public async Task Delete(ProviderID obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			_database.Entry(obj).State = EntityState.Deleted;
			// TODO handle ExternalID deletion when they refer to this providerID.
			await _database.SaveChangesAsync();
		}
	}
}