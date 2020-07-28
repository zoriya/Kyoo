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
	public class LibraryItemRepository : LocalRepository<LibraryItem>, ILibraryItemRepository
	{
		private readonly DatabaseContext _database;
		private readonly IProviderRepository _providers;
		private readonly Lazy<ILibraryRepository> _libraries;
		private readonly Lazy<IShowRepository> _shows;
		private readonly Lazy<ICollectionRepository> _collections;
		protected override Expression<Func<LibraryItem, object>> DefaultSort => x => x.Title;


		public LibraryItemRepository(DatabaseContext database, IProviderRepository providers, IServiceProvider services)
			: base(database)
		{
			_database = database;
			_providers = providers;
			_libraries = new Lazy<ILibraryRepository>(services.GetRequiredService<ILibraryRepository>);
			_shows = new Lazy<IShowRepository>(services.GetRequiredService<IShowRepository>);
			_collections = new Lazy<ICollectionRepository>(services.GetRequiredService<ICollectionRepository>);
		}
		
		public override void Dispose()
		{
			_database.Dispose();
			_providers.Dispose();
			if (_shows.IsValueCreated)
				_shows.Value.Dispose();
			if (_collections.IsValueCreated)
				_collections.Value.Dispose();
		}

		public override async ValueTask DisposeAsync()
		{
			await _database.DisposeAsync();
			await _providers.DisposeAsync();
			if (_shows.IsValueCreated)
				await _shows.Value.DisposeAsync();
			if (_collections.IsValueCreated)
				await _collections.Value.DisposeAsync();
		}
		
		public override async Task<LibraryItem> Get(int id)
		{
			return id > 0 
				? new LibraryItem(await _shows.Value.Get(id)) 
				: new LibraryItem(await _collections.Value.Get(-id));
		}
		
		public override Task<LibraryItem> Get(string slug)
		{
			throw new InvalidOperationException();
		}

		private IQueryable<LibraryItem> ItemsQuery 
			=> _database.Shows
				.Where(x => !_database.CollectionLinks.Any(y => y.ShowID == x.ID))
				.Select(LibraryItem.FromShow)
				.Concat(_database.Collections
					.Select(LibraryItem.FromCollection));

		public override Task<ICollection<LibraryItem>> GetAll(Expression<Func<LibraryItem, bool>> where = null,
			Sort<LibraryItem> sort = default,
			Pagination limit = default)
		{
			return ApplyFilters(ItemsQuery, where, sort, limit);
		}

		public override async Task<ICollection<LibraryItem>> Search(string query)
		{
			return await ItemsQuery
				.Where(x => EF.Functions.ILike(x.Title, $"%{query}%"))
				.Take(20)
				.ToListAsync();
		}

		public override Task<LibraryItem> Create(LibraryItem obj) => throw new InvalidOperationException();
		public override Task<LibraryItem> CreateIfNotExists(LibraryItem obj) => throw new InvalidOperationException();
		public override Task<LibraryItem> Edit(LibraryItem obj, bool reset) => throw new InvalidOperationException();
		protected override Task Validate(LibraryItem obj) => throw new InvalidOperationException();
		public override Task Delete(int id) => throw new InvalidOperationException();
		public override Task Delete(string slug) => throw new InvalidOperationException();
		public override Task Delete(LibraryItem obj) => throw new InvalidOperationException();

		private IQueryable<LibraryItem> LibraryRelatedQuery(Expression<Func<LibraryLink, bool>> selector)
			=> _database.LibraryLinks
				.Where(selector)
				.Select(x => x.Show)
				.Where(x => x != null)
				.Where(x => !_database.CollectionLinks.Any(y => y.ShowID == x.ID))
				.Select(LibraryItem.FromShow)
				.Concat(_database.LibraryLinks
					.Where(selector)
					.Select(x => x.Collection)
					.Where(x => x != null)
					.Select(LibraryItem.FromCollection));

		public async Task<ICollection<LibraryItem>> GetFromLibrary(int id, 
			Expression<Func<LibraryItem, bool>> where = null, 
			Sort<LibraryItem> sort = default, 
			Pagination limit = default)
		{
			ICollection<LibraryItem> items = await ApplyFilters(LibraryRelatedQuery(x => x.LibraryID == id),
				where,
				sort,
				limit);
			if (!items.Any() && await _libraries.Value.Get(id) == null)
				throw new ItemNotFound();
			return items;
		}
		
		public async Task<ICollection<LibraryItem>> GetFromLibrary(string slug, 
			Expression<Func<LibraryItem, bool>> where = null, 
			Sort<LibraryItem> sort = default, 
			Pagination limit = default)
		{
			ICollection<LibraryItem> items = await ApplyFilters(LibraryRelatedQuery(x => x.Library.Slug == slug),
				where,
				sort,
				limit);
			if (!items.Any() && await _libraries.Value.Get(slug) == null)
				throw new ItemNotFound();
			return items;
		}
	}
}