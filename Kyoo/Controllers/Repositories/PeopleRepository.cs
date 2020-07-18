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
	public class PeopleRepository : IPeopleRepository
	{
		private readonly DatabaseContext _database;
		private readonly IProviderRepository _providers;

		public PeopleRepository(DatabaseContext database, IProviderRepository providers)
		{
			_database = database;
			_providers = providers;
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

		public async Task<ICollection<People>> GetAll(Expression<Func<People, bool>> where = null, 
			Sort<People> sort = default,
			Pagination limit = default)
		{
			return await _database.Peoples.ToListAsync();
		}

		public async Task<People> Create(People obj)
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
				_database.DiscardChanges();
				if (Helper.IsDuplicateException(ex))
					throw new DuplicatedItemException($"Trying to insert a duplicated people (slug {obj.Slug} already exists).");
				throw;
			}
			
			return obj;
		}

		public async Task<People> CreateIfNotExists(People obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			People old = await Get(obj.Slug);
			if (old != null)
				return old;
			try
			{
				return await Create(obj);
			}
			catch (DuplicatedItemException)
			{
				old = await Get(obj.Slug);
				if (old == null)
					throw new SystemException("Unknown database state.");
				return old;
			}
		}

		public async Task<People> Edit(People edited, bool resetOld)
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
			return old;
		}
		
		private async Task Validate(People obj)
		{
			if (obj.ExternalIDs != null)
				foreach (MetadataID link in obj.ExternalIDs)
					link.Provider = await _providers.CreateIfNotExists(link.Provider);
		}
		
		public async Task Delete(int id)
		{
			People obj = await Get(id);
			await Delete(obj);
		}

		public async Task Delete(string slug)
		{
			People obj = await Get(slug);
			await Delete(obj);
		}

		public async Task Delete(People obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			_database.Entry(obj).State = EntityState.Deleted;
			if (obj.ExternalIDs != null)
				foreach (MetadataID entry in obj.ExternalIDs)
					_database.Entry(entry).State = EntityState.Deleted;
			if (obj.Roles != null)
				foreach (PeopleLink link in obj.Roles)
					_database.Entry(link).State = EntityState.Deleted;
			await _database.SaveChangesAsync();
		}
		
		public async Task DeleteRange(IEnumerable<People> objs)
		{
			foreach (People obj in objs)
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