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
		
		public async Task<ProviderID> Get(long id)
		{
			return await _database.Providers.FirstOrDefaultAsync(x => x.ID == id);
		}
		
		public async Task<ProviderID> Get(string slug)
		{
			return await _database.Providers.FirstOrDefaultAsync(x => x.Name == slug);
		}

		public async Task<IEnumerable<ProviderID>> Search(string query)
		{
			return await _database.Providers
				.Where(x => EF.Functions.Like(x.Name, $"%{query}%"))
				.Take(20)
				.ToListAsync();
		}

		public async Task<IEnumerable<ProviderID>> GetAll()
		{
			return await _database.Providers.ToListAsync();
		}

		public async Task<long> Create(ProviderID obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			await _database.Providers.AddAsync(obj);
			await _database.SaveChangesAsync();
			return obj.ID;
		}
		
		public async Task<long> CreateIfNotExists(ProviderID obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			ProviderID old = await Get(obj.Name);
			if (old != null)
				return old.ID;
			return await Create(obj);
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
			_database.Providers.Remove(obj);
			await _database.SaveChangesAsync();
		}
	}
}