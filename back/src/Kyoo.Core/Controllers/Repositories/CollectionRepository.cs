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
	/// A local repository to handle collections
	/// </summary>
	public class CollectionRepository : LocalRepository<Collection>
	{
		/// <summary>
		/// The database handle
		/// </summary>
		private readonly DatabaseContext _database;

		/// <inheritdoc />
		protected override Sort<Collection> DefaultSort => new Sort<Collection>.By(nameof(Collection.Name));

		/// <summary>
		/// Create a new <see cref="CollectionRepository"/>.
		/// </summary>
		/// <param name="database">The database handle to use</param>
		/// <param name="thumbs">The thumbnail manager used to store images.</param>
		public CollectionRepository(DatabaseContext database, IThumbnailsManager thumbs)
			: base(database, thumbs)
		{
			_database = database;
		}

		/// <inheritdoc />
		public override async Task<ICollection<Collection>> Search(string query)
		{
			return (await Sort(
				_database.Collections
					.Where(_database.Like<Collection>(x => x.Name + " " + x.Slug, $"%{query}%"))
					.Take(20)
				).ToListAsync())
				.Select(SetBackingImageSelf).ToList();
		}

		/// <inheritdoc />
		public override async Task<Collection> Create(Collection obj)
		{
			await base.Create(obj);
			_database.Entry(obj).State = EntityState.Added;
			await _database.SaveChangesAsync(() => Get(obj.Slug));
			OnResourceCreated(obj);
			return obj;
		}

		/// <inheritdoc />
		protected override async Task Validate(Collection resource)
		{
			await base.Validate(resource);

			if (string.IsNullOrEmpty(resource.Name))
				throw new ArgumentException("The collection's name must be set and not empty");
		}

		/// <inheritdoc />
		public override async Task Delete(Collection obj)
		{
			_database.Entry(obj).State = EntityState.Deleted;
			await _database.SaveChangesAsync();
			await base.Delete(obj);
		}
	}
}
