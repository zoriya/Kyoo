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
		private readonly Lazy<IShowRepository> _shows;
		protected override Expression<Func<GenreDE, object>> DefaultSort => x => x.Slug;
		
		
		public GenreRepository(DatabaseContext database, IServiceProvider services) : base(database)
		{
			_database = database;
			_shows = new Lazy<IShowRepository>(services.GetRequiredService<IShowRepository>);
		}

		public override void Dispose()
		{
			if (_disposed)
				return;
			_disposed = true;
			_database.Dispose();
			if (_shows.IsValueCreated)
				_shows.Value.Dispose();
		}

		public override async ValueTask DisposeAsync()
		{
			if (_disposed)
				return;
			_disposed = true;
			await _database.DisposeAsync();
			if (_shows.IsValueCreated)
				await _shows.Value.DisposeAsync();
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

		public async Task<ICollection<Genre>> GetFromShow(int showID, 
			Expression<Func<Genre, bool>> where = null, 
			Sort<Genre> sort = default, 
			Pagination limit = default)
		{
			ICollection<Genre> genres = await ApplyFilters(_database.GenreLinks.Where(x => x.ShowID == showID)
					.Select(x => (GenreDE)x.Genre),
				where,
				sort,
				limit);
			if (!genres.Any() && await _shows.Value.Get(showID) == null)
				throw new ItemNotFound();
			return genres;
		}

		public async Task<ICollection<Genre>> GetFromShow(string showSlug, 
			Expression<Func<Genre, bool>> where = null, 
			Sort<Genre> sort = default,
			Pagination limit = default)
		{
			ICollection<Genre> genres = await ApplyFilters(_database.GenreLinks
					.Where(x => x.Show.Slug == showSlug)
					.Select(x => (GenreDE)x.Genre),
				where,
				sort,
				limit);
			if (!genres.Any() && await _shows.Value.Get(showSlug) == null)
				throw new ItemNotFound();
			return genres;
		}
	}
}