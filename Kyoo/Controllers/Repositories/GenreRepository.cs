using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Kyoo.Controllers
{
	public class GenreRepository : LocalRepository<Genre, GenreDE>, IGenreRepository
	{
		private bool _disposed;
		private readonly DatabaseContext _database;
		protected override Expression<Func<GenreDE, object>> DefaultSort => x => x.Slug;
		
		
		public GenreRepository(DatabaseContext database) : base(database)
		{
			_database = database;
		}

		public override void Dispose()
		{
			if (_disposed)
				return;
			_disposed = true;
			_database.Dispose();
		}

		public override async ValueTask DisposeAsync()
		{
			if (_disposed)
				return;
			_disposed = true;
			await _database.DisposeAsync();
		}

		public override async Task<ICollection<Genre>> Search(string query)
		{
			return await _database.Genres
				.Where(genre => EF.Functions.ILike(genre.Name, $"%{query}%"))
				.Take(20)
				.ToListAsync<Genre>();
		}

		public override async Task<GenreDE> Create(GenreDE obj)
		{
			await base.Create(obj);
			_database.Entry(obj).State = EntityState.Added;
			await _database.SaveChangesAsync($"Trying to insert a duplicated genre (slug {obj.Slug} already exists).");
			return obj;
		}

		public override async Task Delete(GenreDE obj)
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