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
	public class LibraryItemRepository : LocalRepository<LibraryItem>
	{
		/// <summary>
		/// The database handle
		/// </summary>
		private readonly DatabaseContext _database;

		/// <inheritdoc />
		protected override Sort<LibraryItem> DefaultSort => new Sort<LibraryItem>.By(x => x.Name);

		/// <summary>
		/// Create a new <see cref="LibraryItemRepository"/>.
		/// </summary>
		/// <param name="database">The database instance</param>
		/// <param name="thumbs">The thumbnail manager used to store images.</param>
		public LibraryItemRepository(DatabaseContext database, IThumbnailsManager thumbs)
			: base(database, thumbs)
		{
			_database = database;
		}

		/// <inheritdoc />
		public override async Task<ICollection<LibraryItem>> Search(string query)
		{
			return (await Sort(
					_database.LibraryItems
					.Where(_database.Like<LibraryItem>(x => x.Name, $"%{query}%"))
				)
				.Take(20)
				.ToListAsync())
				.Select(SetBackingImageSelf)
				.ToList();
		}

		/// <inheritdoc />
		public override Task<LibraryItem> Create(LibraryItem obj)
			=> throw new InvalidOperationException();

		/// <inheritdoc />
		public override Task<LibraryItem> CreateIfNotExists(LibraryItem obj)
			=> throw new InvalidOperationException();

		/// <inheritdoc />
		public override Task<LibraryItem> Edit(LibraryItem edited)
			=> throw new InvalidOperationException();

		/// <inheritdoc />
		public override Task<LibraryItem> Patch(int id, Func<LibraryItem, Task<bool>> patch)
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
	}
}
