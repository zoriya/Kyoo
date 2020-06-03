using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Controllers
{
	public class PeopleRepository : IPeopleRepository
	{
		private readonly DatabaseContext _database;
		private readonly IProviderRepository _providers;

		public PeopleRepository(DatabaseContext database, IProviderRepository providers)
		{
			_database = database;
			_providers = providers;
		}

		public Task<People> Get(long id)
		{
			return _database.Peoples.FirstOrDefaultAsync(x => x.ID == id);
		}

		public Task<People> Get(string slug)
		{
			return _database.Peoples.FirstOrDefaultAsync(x => x.Slug == slug);
		}

		public async Task<IEnumerable<People>> Search(string query)
		{
			return await _database.Peoples
				.Where(people => EF.Functions.Like(people.Name, $"%{query}%"))
				.Take(20)
				.ToListAsync();
		}

		public async Task<IEnumerable<People>> GetAll()
		{
			return await _database.Peoples.ToListAsync();
		}

		public async Task<long> Create(People obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			await Validate(obj);
			obj.Roles = null;
			
			await _database.Peoples.AddAsync(obj);
			await _database.SaveChangesAsync();
			return obj.ID;
		}

		public async Task<long> CreateIfNotExists(People obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			People old = await Get(obj.Slug);
			if (old != null)
				return old.ID;
			return await Create(obj);
		}

		public async Task Edit(People edited, bool resetOld)
		{
			if (edited == null)
				throw new ArgumentNullException(nameof(edited));
			
			People old = await Get(edited.Slug);

			if (old == null)
				throw new ItemNotFound($"No people found with the slug {edited.Slug}.");
			
			if (resetOld)
				Utility.Nullify(old);
			Utility.Merge(old, edited);
			await Validate(old);
			await _database.SaveChangesAsync();
		}
		
		private async Task Validate(People obj)
		{
			obj.ExternalIDs = (await Task.WhenAll(obj.ExternalIDs.Select(async x =>
			{
				x.ProviderID = await _providers.CreateIfNotExists(x.Provider);
				return x;
			}))).ToList();
		}

		public async Task Delete(People obj)
		{
			_database.Peoples.Remove(obj);
			await _database.SaveChangesAsync();
		}
	}
}