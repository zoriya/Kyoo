using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Controllers
{
	public class GenreRepository : IGenreRepository
	{
		private readonly DatabaseContext _database;
		
		
		public GenreRepository(DatabaseContext database)
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

		public async Task<Genre> Get(int id)
		{
			return await _database.Genres.FirstOrDefaultAsync(x => x.ID == id);
		}

		public async Task<Genre> Get(string slug)
		{
			return await _database.Genres.FirstOrDefaultAsync(x => x.Slug == slug);
		}

		public async Task<ICollection<Genre>> Search(string query)
		{
			return await _database.Genres
				.Where(genre => EF.Functions.Like(genre.Name, $"%{query}%"))
				.Take(20)
				.ToListAsync();
		}

		public async Task<ICollection<Genre>> GetAll()
		{
			return await _database.Genres.ToListAsync();
		}

		public async Task<int> Create(Genre obj)
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
					throw new DuplicatedItemException($"Trying to insert a duplicated genre (slug {obj.Slug} already exists).");
				throw;
			}
			
			return obj.ID;
		}

		public async Task<int> CreateIfNotExists(Genre obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			Genre old = await Get(obj.Slug);
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

		public async Task Edit(Genre edited, bool resetOld)
		{
			if (edited == null)
				throw new ArgumentNullException(nameof(edited));
			
			Genre old = await Get(edited.Slug);

			if (old == null)
				throw new ItemNotFound($"No genre found with the slug {edited.Slug}.");
			
			if (resetOld)
				Utility.Nullify(old);
			Utility.Merge(old, edited);
			await _database.SaveChangesAsync();
		}

		public async Task Delete(Genre obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			_database.Genres.Remove(obj);
			await _database.SaveChangesAsync();
		}
	}
}