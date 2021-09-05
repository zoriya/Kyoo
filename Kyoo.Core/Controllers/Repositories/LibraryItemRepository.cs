using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Exceptions;
using Kyoo.Database;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Core.Controllers
{
	/// <summary>
	/// A local repository to handle library items.
	/// </summary>
	public class LibraryItemRepository : LocalRepository<LibraryItem>, ILibraryItemRepository
	{
		/// <summary>
		/// The database handle
		/// </summary>
		private readonly DatabaseContext _database;

		/// <summary>
		/// A lazy loaded library repository to validate queries (check if a library does exist)
		/// </summary>
		private readonly Lazy<ILibraryRepository> _libraries;

		/// <inheritdoc />
		protected override Expression<Func<LibraryItem, object>> DefaultSort => x => x.Title;

		/// <summary>
		/// Create a new <see cref="LibraryItemRepository"/>.
		/// </summary>
		/// <param name="database">The database instance</param>
		/// <param name="libraries">A lazy loaded library repository</param>
		public LibraryItemRepository(DatabaseContext database,
			Lazy<ILibraryRepository> libraries)
			: base(database)
		{
			_database = database;
			_libraries = libraries;
		}

		/// <inheritdoc />
		public override Task<LibraryItem> GetOrDefault(int id)
		{
			return _database.LibraryItems.FirstOrDefaultAsync(x => x.ID == id);
		}

		/// <inheritdoc />
		public override Task<LibraryItem> GetOrDefault(string slug)
		{
			return _database.LibraryItems.SingleOrDefaultAsync(x => x.Slug == slug);
		}

		/// <inheritdoc />
		public override Task<ICollection<LibraryItem>> GetAll(Expression<Func<LibraryItem, bool>> where = null,
			Sort<LibraryItem> sort = default,
			Pagination limit = default)
		{
			return ApplyFilters(_database.LibraryItems, where, sort, limit);
		}

		/// <inheritdoc />
		public override Task<int> GetCount(Expression<Func<LibraryItem, bool>> where = null)
		{
			IQueryable<LibraryItem> query = _database.LibraryItems;
			if (where != null)
				query = query.Where(where);
			return query.CountAsync();
		}

		/// <inheritdoc />
		public override async Task<ICollection<LibraryItem>> Search(string query)
		{
			return await _database.LibraryItems
				.Where(_database.Like<LibraryItem>(x => x.Title, $"%{query}%"))
				.OrderBy(DefaultSort)
				.Take(20)
				.ToListAsync();
		}

		/// <inheritdoc />
		public override Task<LibraryItem> Create(LibraryItem obj)
			=> throw new InvalidOperationException();

		/// <inheritdoc />
		public override Task<LibraryItem> CreateIfNotExists(LibraryItem obj)
			=> throw new InvalidOperationException();

		/// <inheritdoc />
		public override Task<LibraryItem> Edit(LibraryItem obj, bool resetOld)
			=> throw new InvalidOperationException();

		/// <inheritdoc />
		public override Task Delete(int id)
			=> throw new InvalidOperationException();

		/// <inheritdoc />
		public override Task Delete(string slug)
			=> throw new InvalidOperationException();

		/// <inheritdoc />
		public override Task Delete(LibraryItem obj)
			=> throw new InvalidOperationException();

		/// <summary>
		/// Get a basic queryable for a library with the right mapping from shows & collections.
		/// Shows contained in a collection are excluded.
		/// </summary>
		/// <param name="selector">Only items that are part of a library that match this predicate will be returned.</param>
		/// <returns>A queryable containing items that are part of a library matching the selector.</returns>
		private IQueryable<LibraryItem> LibraryRelatedQuery(Expression<Func<Library, bool>> selector)
			=> _database.Libraries
				.Where(selector)
				.SelectMany(x => x.Shows)
				.Where(x => !x.Collections.Any())
				.Select(LibraryItem.FromShow)
				.Concat(_database.Libraries
					.Where(selector)
					.SelectMany(x => x.Collections)
					.Select(LibraryItem.FromCollection));

		/// <inheritdoc />
		public async Task<ICollection<LibraryItem>> GetFromLibrary(int id,
			Expression<Func<LibraryItem, bool>> where = null,
			Sort<LibraryItem> sort = default,
			Pagination limit = default)
		{
			ICollection<LibraryItem> items = await ApplyFilters(LibraryRelatedQuery(x => x.ID == id),
				where,
				sort,
				limit);
			if (!items.Any() && await _libraries.Value.GetOrDefault(id) == null)
				throw new ItemNotFoundException();
			return items;
		}

		/// <inheritdoc />
		public async Task<ICollection<LibraryItem>> GetFromLibrary(string slug,
			Expression<Func<LibraryItem, bool>> where = null,
			Sort<LibraryItem> sort = default,
			Pagination limit = default)
		{
			ICollection<LibraryItem> items = await ApplyFilters(LibraryRelatedQuery(x => x.Slug == slug),
				where,
				sort,
				limit);
			if (!items.Any() && await _libraries.Value.GetOrDefault(slug) == null)
				throw new ItemNotFoundException();
			return items;
		}
	}
}