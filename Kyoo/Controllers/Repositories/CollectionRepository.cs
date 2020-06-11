using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;
using Npgsql;

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

		public async Task<ICollection<Collection>> GetAll()
		{
			return await _database.Collections.ToListAsync();
		}

		public async Task<int> Create(Collection obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			try
			{
				await _database.Collections.AddAsync(obj);
				await _database.SaveChangesAsync();
			}
			catch (DbUpdateException ex)
			{
				if (ex.InnerException is PostgresException inner && inner.SqlState == PostgresErrorCodes.UniqueViolation)
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

		public async Task Delete(Collection obj)
		{
			_database.Collections.Remove(obj);
			await _database.SaveChangesAsync();
		}
	}
}