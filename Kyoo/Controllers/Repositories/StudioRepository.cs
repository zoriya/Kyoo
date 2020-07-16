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

		public async Task<ICollection<Studio>> GetAll(Expression<Func<Studio, bool>> where = null, 
			Sort<Studio> sort = default,
			Pagination page = default)
		{
			return await _database.Studios.ToListAsync();
		}

		public async Task<Studio> Create(Studio obj)
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
					throw new DuplicatedItemException($"Trying to insert a duplicated studio (slug {obj.Slug} already exists).");
				throw;
			}
			return obj;
		}
		
		public async Task<Studio> CreateIfNotExists(Studio obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			Studio old = await Get(obj.Slug);
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

		public async Task<Studio> Edit(Studio edited, bool resetOld)
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
			return old;
		}

		public async Task Delete(int id)
		{
			Studio obj = await Get(id);
			await Delete(obj);
		}

		public async Task Delete(string slug)
		{
			Studio obj = await Get(slug);
			await Delete(obj);
		}
		
		public async Task Delete(Studio obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			_database.Entry(obj).State = EntityState.Deleted;
			
			// Using Dotnet-EF change discovery service to remove references to this studio on shows.
			foreach (Show show in obj.Shows)
				show.StudioID = null;
			await _database.SaveChangesAsync();
		}
		
		public async Task DeleteRange(IEnumerable<Studio> objs)
		{
			foreach (Studio obj in objs)
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