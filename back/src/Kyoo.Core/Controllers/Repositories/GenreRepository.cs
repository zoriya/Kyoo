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
using Kyoo.Utils;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Core.Controllers
{
	/// <summary>
	/// A local repository for genres.
	/// </summary>
	public class GenreRepository : LocalRepository<Genre>, IGenreRepository
	{
		/// <summary>
		/// The database handle
		/// </summary>
		private readonly DatabaseContext _database;

		/// <inheritdoc />
		protected override Sort<Genre> DefaultSort => new Sort<Genre>.By(x => x.Slug);

		/// <summary>
		/// Create a new <see cref="GenreRepository"/>.
		/// </summary>
		/// <param name="database">The database handle</param>
		public GenreRepository(DatabaseContext database)
			: base(database)
		{
			_database = database;
		}

		/// <inheritdoc />
		public override async Task<ICollection<Genre>> Search(string query)
		{
			return await Sort(
				_database.Genres
					.Where(_database.Like<Genre>(x => x.Name, $"%{query}%"))
				)
				.Take(20)
				.ToListAsync();
		}

		/// <inheritdoc />
		protected override async Task Validate(Genre resource)
		{
			resource.Slug ??= Utility.ToSlug(resource.Name);
			await base.Validate(resource);
		}

		/// <inheritdoc />
		public override async Task<Genre> Create(Genre obj)
		{
			await base.Create(obj);
			_database.Entry(obj).State = EntityState.Added;
			await _database.SaveChangesAsync(() => Get(obj.Slug));
			OnResourceCreated(obj);
			return obj;
		}

		/// <inheritdoc />
		public override async Task Delete(Genre obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			_database.Entry(obj).State = EntityState.Deleted;
			await _database.SaveChangesAsync();
			await base.Delete(obj);
		}
	}
}
