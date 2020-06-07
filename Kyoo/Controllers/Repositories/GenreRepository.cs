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

			await _database.Genres.AddAsync(obj);
			await _database.SaveChangesAsync();
			return obj.ID;
		}

		public async Task<int> CreateIfNotExists(Genre obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			Genre old = await Get(obj.Slug);
			if (old != null)
				return old.ID;
			return await Create(obj);
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
			_database.Genres.Remove(obj);
			await _database.SaveChangesAsync();
		}
	}
}