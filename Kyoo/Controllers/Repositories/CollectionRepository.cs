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
	public class CollectionRepository : LocalRepository<Collection>, ICollectionRepository
	{
		private readonly DatabaseContext _database;
		private readonly Lazy<IShowRepository> _shows;
		private readonly Lazy<ILibraryRepository> _libraries;
		protected override Expression<Func<Collection, object>> DefaultSort => x => x.Name;

		public CollectionRepository(DatabaseContext database, IServiceProvider services) : base(database)
		{
			_database = database;
			_shows = new Lazy<IShowRepository>(services.GetRequiredService<IShowRepository>);
			_libraries = new Lazy<ILibraryRepository>(services.GetRequiredService<ILibraryRepository>);
		}

		public override void Dispose()
		{
			base.Dispose();
			if (_shows.IsValueCreated)
				_shows.Value.Dispose();
			if (_libraries.IsValueCreated)
				_libraries.Value.Dispose();
		}

		public override async ValueTask DisposeAsync()
		{
			await _database.DisposeAsync();
			if (_shows.IsValueCreated)
				await _shows.Value.DisposeAsync();
			if (_libraries.IsValueCreated)
				await _libraries.Value.DisposeAsync();
		}

		public override async Task<ICollection<Collection>> Search(string query)
		{
			return await _database.Collections
				.Where(x => EF.Functions.ILike(x.Name, $"%{query}%"))
				.Take(20)
				.ToListAsync();
		}

		public override async Task<Collection> Create(Collection obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			_database.Entry(obj).State = EntityState.Added;
			await _database.SaveChangesAsync($"Trying to insert a duplicated collection (slug {obj.Slug} already exists).");
			return obj;
		}

		public override async Task Delete(Collection obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			_database.Entry(obj).State = EntityState.Deleted;
			if (obj.Links != null)
				foreach (CollectionLink link in obj.Links)
					_database.Entry(link).State = EntityState.Deleted;
			if (obj.LibraryLinks != null)
				foreach (LibraryLink link in obj.LibraryLinks)
					_database.Entry(link).State = EntityState.Deleted;
			await _database.SaveChangesAsync();
		}

		public async Task<ICollection<Collection>> GetFromShow(int showID, 
			Expression<Func<Collection, bool>> where = null,
			Sort<Collection> sort = default,
			Pagination limit = default)
		{
			ICollection<Collection> collections = await ApplyFilters(_database.CollectionLinks
					.Where(x => x.ShowID == showID)
					.Select(x => x.Collection),
				where,
				sort,
				limit);
			if (!collections.Any() & await _shows.Value.Get(showID) == null)
				throw new ItemNotFound();
			return collections;
		}

		public async Task<ICollection<Collection>> GetFromShow(string showSlug, 
			Expression<Func<Collection, bool>> where = null,
			Sort<Collection> sort = default,
			Pagination limit = default)
		{
			ICollection<Collection> collections = await ApplyFilters(_database.CollectionLinks
					.Where(x => x.Show.Slug == showSlug)
					.Select(x => x.Collection),
				where,
				sort,
				limit);
			if (!collections.Any() & await _shows.Value.Get(showSlug) == null)
				throw new ItemNotFound();
			return collections;
		}

		public async Task<ICollection<Collection>> GetFromLibrary(int id,
			Expression<Func<Collection, bool>> where = null,
			Sort<Collection> sort = default,
			Pagination limit = default)
		{
			ICollection<Collection> collections = await ApplyFilters(_database.LibraryLinks
					.Where(x => x.LibraryID == id && x.CollectionID != null)
					.Select(x => x.Collection),
				where,
				sort,
				limit);
			if (!collections.Any() && await _libraries.Value.Get(id) == null)
				throw new ItemNotFound();
			return collections;
		}

		public async Task<ICollection<Collection>> GetFromLibrary(string slug,
			Expression<Func<Collection, bool>> where = null,
			Sort<Collection> sort = default,
			Pagination limit = default)
		{
			ICollection<Collection> collections = await ApplyFilters(_database.LibraryLinks
					.Where(x => x.Library.Slug == slug && x.CollectionID != null)
					.Select(x => x.Collection),
				where,
				sort,
				limit);
			if (!collections.Any() && await _libraries.Value.Get(slug) == null)
				throw new ItemNotFound();
			return collections;
		}
	}
	
	
}