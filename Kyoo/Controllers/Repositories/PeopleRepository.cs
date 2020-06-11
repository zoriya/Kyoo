using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Kyoo.Controllers
{
	public class PeopleRepository : IPeopleRepository
	{
		private readonly DatabaseContext _database;
		private readonly IServiceProvider _serviceProvider;

		public PeopleRepository(DatabaseContext database, IServiceProvider serviceProvider)
		{
			_database = database;
			_serviceProvider = serviceProvider;
		}
		
		public void Dispose()
		{
			_database.Dispose();
		}

		public ValueTask DisposeAsync()
		{
			return _database.DisposeAsync();
		}

		public Task<People> Get(int id)
		{
			return _database.Peoples.FirstOrDefaultAsync(x => x.ID == id);
		}

		public Task<People> Get(string slug)
		{
			return _database.Peoples.FirstOrDefaultAsync(x => x.Slug == slug);
		}

		public async Task<ICollection<People>> Search(string query)
		{
			return await _database.Peoples
				.Where(people => EF.Functions.Like(people.Name, $"%{query}%"))
				.Take(20)
				.ToListAsync();
		}

		public async Task<ICollection<People>> GetAll()
		{
			return await _database.Peoples.ToListAsync();
		}

		public async Task<int> Create(People obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			await Validate(obj);
			_database.Entry(obj).State = EntityState.Added;
			if (obj.ExternalIDs != null)
				foreach (MetadataID entry in obj.ExternalIDs)
					_database.Entry(entry).State = EntityState.Added;
			
			try
			{
				await _database.SaveChangesAsync();
			}
			catch (DbUpdateException ex)
			{
				if (Helper.IsDuplicateException(ex))
					throw new DuplicatedItemException($"Trying to insert a duplicated people (slug {obj.Slug} already exists).");
				throw;
			}
			
			return obj.ID;
		}

		public async Task<int> CreateIfNotExists(People obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			People old = await Get(obj.Slug);
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
				using IServiceScope serviceScope = _serviceProvider.CreateScope();
				await using IProviderRepository providers = serviceScope.ServiceProvider.GetService<IProviderRepository>();
				
				x.ProviderID = await providers.CreateIfNotExists(x.Provider);
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