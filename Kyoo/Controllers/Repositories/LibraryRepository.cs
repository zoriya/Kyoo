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
	public class LibraryRepository : LocalRepository<Library>, ILibraryRepository
	{
		private readonly DatabaseContext _database;
		private readonly IProviderRepository _providers;
		private readonly Lazy<IShowRepository> _shows;
		protected override Expression<Func<Library, object>> DefaultSort => x => x.ID;


		public LibraryRepository(DatabaseContext database, IProviderRepository providers, IServiceProvider services)
			: base(database)
		{
			_database = database;
			_providers = providers;
			_shows = new Lazy<IShowRepository>(services.GetRequiredService<IShowRepository>);
		}
		
		public override void Dispose()
		{
			_database.Dispose();
			_providers.Dispose();
			if (_shows.IsValueCreated)
				_shows.Value.Dispose();
		}

		public override async ValueTask DisposeAsync()
		{
			await _database.DisposeAsync();
			await _providers.DisposeAsync();
			if (_shows.IsValueCreated)
				await _shows.Value.DisposeAsync();
		}

		public override async Task<ICollection<Library>> Search(string query)
		{
			return await _database.Libraries
				.Where(x => EF.Functions.ILike(x.Name, $"%{query}%"))
				.Take(20)
				.ToListAsync();
		}

		public override async Task<Library> Create(Library obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			await Validate(obj);
			_database.Entry(obj).State = EntityState.Added;
			if (obj.ProviderLinks != null)
				foreach (ProviderLink entry in obj.ProviderLinks)
					_database.Entry(entry).State = EntityState.Added;
			
			await _database.SaveChangesAsync($"Trying to insert a duplicated library (slug {obj.Slug} already exists).");
			return obj;
		}

		protected override async Task Validate(Library obj)
		{
			if (string.IsNullOrEmpty(obj.Slug))
				throw new ArgumentException("The library's slug must be set and not empty");
			if (string.IsNullOrEmpty(obj.Name))
				throw new ArgumentException("The library's name must be set and not empty");
			if (obj.Paths == null || !obj.Paths.Any())
				throw new ArgumentException("The library should have a least one path.");
			
			await base.Validate(obj);
			
			if (obj.ProviderLinks != null)
				foreach (ProviderLink link in obj.ProviderLinks)
					link.Provider = await _providers.CreateIfNotExists(link.Provider);
		}

		public override async Task Delete(Library obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			_database.Entry(obj).State = EntityState.Deleted;
			if (obj.ProviderLinks != null)
				foreach (ProviderLink entry in obj.ProviderLinks)
					_database.Entry(entry).State = EntityState.Deleted;
			if (obj.Links != null)
				foreach (LibraryLink entry in obj.Links)
					_database.Entry(entry).State = EntityState.Deleted;
			await _database.SaveChangesAsync();
		}

		public async Task<ICollection<Library>> GetFromShow(int showID, 
			Expression<Func<Library, bool>> where = null, 
			Sort<Library> sort = default, 
			Pagination limit = default)
		{
			ICollection<Library> libraries = await ApplyFilters(_database.LibraryLinks
					.Where(x => x.ShowID == showID)
					.Select(x => x.Library),
				where,
				sort,
				limit);
			if (!libraries.Any() && await _shows.Value.Get(showID) == null)
				throw new ItemNotFound();
			return libraries;
		}

		public async Task<ICollection<Library>> GetFromShow(string showSlug, 
			Expression<Func<Library, bool>> where = null, 
			Sort<Library> sort = default, 
			Pagination limit = default)
		{
			ICollection<Library> libraries = await ApplyFilters(_database.LibraryLinks
					.Where(x => x.Show.Slug == showSlug)
					.Select(x => x.Library),
				where,
				sort,
				limit);
			if (!libraries.Any() && await _shows.Value.Get(showSlug) == null)
				throw new ItemNotFound();
			return libraries;
		}
		
		public async Task<ICollection<Library>> GetFromCollection(int id, 
			Expression<Func<Library, bool>> where = null, 
			Sort<Library> sort = default, 
			Pagination limit = default)
		{
			ICollection<Library> libraries = await ApplyFilters(_database.LibraryLinks
					.Where(x => x.CollectionID == id)
					.Select(x => x.Library),
				where,
				sort,
				limit);
			if (!libraries.Any() && await _shows.Value.Get(id) == null)
				throw new ItemNotFound();
			return libraries;
		}

		public async Task<ICollection<Library>> GetFromCollection(string slug, 
			Expression<Func<Library, bool>> where = null, 
			Sort<Library> sort = default, 
			Pagination limit = default)
		{
			ICollection<Library> libraries = await ApplyFilters(_database.LibraryLinks
					.Where(x => x.Collection.Slug == slug)
					.Select(x => x.Library),
				where,
				sort,
				limit);
			if (!libraries.Any() && await _shows.Value.Get(slug) == null)
				throw new ItemNotFound();
			return libraries;
		}
	}
}