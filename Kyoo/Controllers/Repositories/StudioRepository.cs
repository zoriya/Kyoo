using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Controllers
{
	public class StudioRepository : IStudioRepository
	{
		private readonly DatabaseContext _database;


		public StudioRepository(DatabaseContext database)
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
		
		public async Task<Studio> Get(int id)
		{
			return await _database.Studios.FirstOrDefaultAsync(x => x.ID == id);
		}
		
		public async Task<Studio> Get(string slug)
		{
			return await _database.Studios.FirstOrDefaultAsync(x => x.Slug == slug);
		}

		public async Task<ICollection<Studio>> Search(string query)
		{
			return await _database.Studios
				.Where(x => EF.Functions.Like(x.Name, $"%{query}%"))
				.Take(20)
				.ToListAsync();
		}

		public async Task<ICollection<Studio>> GetAll()
		{
			return await _database.Studios.ToListAsync();
		}

		public async Task<int> Create(Studio obj)
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
				if (Helper.IsDuplicateException(ex))
					throw new DuplicatedItemException($"Trying to insert a duplicated studio (slug {obj.Slug} already exists).");
				throw;
			}
			return obj.ID;
		}
		
		public async Task<int> CreateIfNotExists(Studio obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			Studio old = await Get(obj.Slug);
			if (old != null)
				return old.ID;
			return await Create(obj);
		}

		public async Task Edit(Studio edited, bool resetOld)
		{
			if (edited == null)
				throw new ArgumentNullException(nameof(edited));
			
			Studio old = await Get(edited.Name);

			if (old == null)
				throw new ItemNotFound($"No studio found with the name {edited.Name}.");
			
			if (resetOld)
				Utility.Nullify(old);
			Utility.Merge(old, edited);
			await _database.SaveChangesAsync();
		}

		public async Task Delete(Studio obj)
		{
			_database.Studios.Remove(obj);
			await _database.SaveChangesAsync();
		}
	}
}