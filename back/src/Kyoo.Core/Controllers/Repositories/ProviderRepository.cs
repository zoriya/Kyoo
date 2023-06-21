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
	///     A local repository to handle providers.
	/// </summary>
	public class ProviderRepository : LocalRepository<Provider>, IProviderRepository
	{
		/// <summary>
		///     The database handle
		/// </summary>
		private readonly DatabaseContext _database;

		/// <summary>
		///     Create a new <see cref="ProviderRepository" />.
		/// </summary>
		/// <param name="database">The database handle</param>
		public ProviderRepository(DatabaseContext database)
			: base(database)
		{
			_database = database;
		}

		/// <inheritdoc />
		protected override Sort<Provider> DefaultSort => new Sort<Provider>.By(x => x.Slug);

		/// <inheritdoc />
		public override async Task<ICollection<Provider>> Search(string query)
		{
			return await Sort(
				_database.Providers
					.Where(_database.Like<Provider>(x => x.Name, $"%{query}%"))
				)
				.Take(20)
				.ToListAsync();
		}

		/// <inheritdoc />
		public override async Task<Provider> Create(Provider obj)
		{
			await base.Create(obj);
			_database.Entry(obj).State = EntityState.Added;
			await _database.SaveChangesAsync(() => Get(obj.Slug));
			OnResourceCreated(obj);
			return obj;
		}

		/// <inheritdoc />
		public override async Task Delete(Provider obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			_database.Entry(obj).State = EntityState.Deleted;
			await _database.SaveChangesAsync();
			await base.Delete(obj);
		}

		/// <inheritdoc />
		public async Task<ICollection<MetadataID>> GetMetadataID<T>(Expression<Func<MetadataID, bool>> where = null,
			Sort<MetadataID> sort = default,
			Pagination limit = default)
			where T : class, IMetadata
		{
			return await _database.MetadataIds<T>()
				.Include(y => y.Provider)
				.Where(where)
				.ToListAsync();
		}
	}
}
