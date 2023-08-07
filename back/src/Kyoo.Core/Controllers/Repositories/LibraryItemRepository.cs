// Kyoo - A portable and vast media library solution.
// Copyright (c) Kyoo.
//
// See AUTHORS.md and LICENSE file in the project root for full license information.
//
// Kyoo is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// any later version.
//
// Kyoo is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Kyoo. If not, see <https://www.gnu.org/licenses/>.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Postgresql;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Core.Controllers
{
	/// <summary>
	/// A local repository to handle library items.
	/// </summary>
	public class LibraryItemRepository : LocalRepository<ILibraryItem>, ILibraryItemRepository
	{
		/// <summary>
		/// The database handle
		/// </summary>
		private readonly DatabaseContext _database;

		/// <inheritdoc />
		protected override Sort<ILibraryItem> DefaultSort => new Sort<ILibraryItem>.By(x => x.Name);

		/// <summary>
		/// Create a new <see cref="ILibraryItemRepository"/>.
		/// </summary>
		/// <param name="database">The database instance</param>
		public LibraryItemRepository(DatabaseContext database)
			: base(database)
		{
			_database = database;
		}

		/// <inheritdoc />
		public override async Task<ILibraryItem> GetOrDefault(int id)
		{
			return await _database.LibraryItems.FirstOrDefaultAsync(x => x.Id == id);
		}

		/// <inheritdoc />
		public override async Task<ILibraryItem> GetOrDefault(string slug)
		{
			return await _database.LibraryItems.SingleOrDefaultAsync(x => x.Slug == slug);
		}

		/// <inheritdoc />
		public override async Task<ICollection<ILibraryItem>> GetAll(Expression<Func<ILibraryItem, bool>> where = null,
			Sort<ILibraryItem> sort = default,
			Pagination limit = default)
		{
			return await ApplyFilters(_database.LibraryItems, where, sort, limit);
		}

		/// <inheritdoc />
		public override Task<int> GetCount(Expression<Func<ILibraryItem, bool>> where = null)
		{
			IQueryable<ILibraryItem> query = _database.LibraryItems;
			if (where != null)
				query = query.Where(where);
			return query.CountAsync();
		}

		/// <inheritdoc />
		public override async Task<ICollection<ILibraryItem>> Search(string query)
		{
			return await Sort(
					_database.LibraryItems
					.Where(_database.Like<LibraryItem>(x => x.Name, $"%{query}%"))
				)
				.Take(20)
				.ToListAsync();
		}

		/// <inheritdoc />
		public override Task<ILibraryItem> Create(ILibraryItem obj)
			=> throw new InvalidOperationException();

		/// <inheritdoc />
		public override Task<ILibraryItem> CreateIfNotExists(ILibraryItem obj)
			=> throw new InvalidOperationException();

		/// <inheritdoc />
		public override Task<ILibraryItem> Edit(ILibraryItem obj, bool resetOld)
			=> throw new InvalidOperationException();

		/// <inheritdoc />
		public override Task Delete(int id)
			=> throw new InvalidOperationException();

		/// <inheritdoc />
		public override Task Delete(string slug)
			=> throw new InvalidOperationException();

		/// <inheritdoc />
		public override Task Delete(ILibraryItem obj)
			=> throw new InvalidOperationException();
	}
}
