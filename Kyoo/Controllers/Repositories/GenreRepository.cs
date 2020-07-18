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
	public class GenreRepository : LocalRepository<Genre>, IGenreRepository
	{
		private readonly DatabaseContext _database;
		protected override Expression<Func<Genre, object>> DefaultSort => x => x.Slug;
		
		
		public GenreRepository(DatabaseContext database) : base(database)
		{
			_database = database;
		}
		

		public async Task<ICollection<Genre>> Search(string query)
		{
			return await _database.Genres
				.Where(genre => EF.Functions.Like(genre.Name, $"%{query}%"))
				.Take(20)
				.ToListAsync();
		}

		public override async Task<Genre> Create(Genre obj)
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
				
				if (IsDuplicateException(ex))
					throw new DuplicatedItemException($"Trying to insert a duplicated genre (slug {obj.Slug} already exists).");
				throw;
			}
			
			return obj;
		}

		protected override Task Validate(Genre ressource)
		{
			return Task.CompletedTask;
		}

		public async Task Delete(Genre obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			_database.Entry(obj).State = EntityState.Deleted;
			if (obj.Links != null)
				foreach (GenreLink link in obj.Links)
					_database.Entry(link).State = EntityState.Deleted;
			await _database.SaveChangesAsync();
		}
	}
}