using System;
using System.Collections.Generic;
using System.Linq;
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
		
		public Task<Collection> Get(long id)
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

		public async Task<long> Create(Collection obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			await _database.Collections.AddAsync(obj);
			await _database.SaveChangesAsync();
			return obj.ID;
		}
		
		public async Task<long> CreateIfNotExists(Collection obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			Collection old = await Get(obj.Slug);
			if (old != null)
				return old.ID;
			return await Create(obj);
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