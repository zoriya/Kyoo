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
using Kyoo.Database;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Core.Controllers
{
	/// <summary>
	/// A local repository to handle collections
	/// </summary>
	public class CollectionRepository : LocalRepository<Collection>, ICollectionRepository
	{
		/// <summary>
		/// The database handle
		/// </summary>
		private readonly DatabaseContext _database;

		/// <summary>
		/// A provider repository to handle externalID creation and deletion
		/// </summary>
		private readonly IProviderRepository _providers;

		/// <inheritdoc />
		protected override Sort<Collection> DefaultSort => new Sort<Collection>.By(nameof(Collection.Name));

		/// <summary>
		/// Create a new <see cref="CollectionRepository"/>.
		/// </summary>
		/// <param name="database">The database handle to use</param>
		/// /// <param name="providers">A provider repository</param>
		public CollectionRepository(DatabaseContext database, IProviderRepository providers)
			: base(database)
		{
			_database = database;
			_providers = providers;
		}

		/// <inheritdoc />
		public override async Task<ICollection<Collection>> Search(string query)
		{
			return await Sort(
				_database.Collections
					.Where(_database.Like<Collection>(x => x.Name + " " + x.Slug, $"%{query}%"))
					.Take(20)
				).ToListAsync();
		}

		/// <inheritdoc />
		public override async Task<Collection> Create(Collection obj)
		{
			await base.Create(obj);
			_database.Entry(obj).State = EntityState.Added;
			await _database.SaveChangesAsync(() => Get(obj.Slug));
			return obj;
		}

		/// <inheritdoc />
		protected override async Task Validate(Collection resource)
		{
			await base.Validate(resource);

			if (string.IsNullOrEmpty(resource.Slug))
				throw new ArgumentException("The collection's slug must be set and not empty");
			if (string.IsNullOrEmpty(resource.Name))
				throw new ArgumentException("The collection's name must be set and not empty");

			if (resource.ExternalIDs != null)
			{
				foreach (MetadataID id in resource.ExternalIDs)
				{
					id.Provider = _database.LocalEntity<Provider>(id.Provider.Slug)
						?? await _providers.CreateIfNotExists(id.Provider);
					id.ProviderID = id.Provider.ID;
				}
				_database.MetadataIds<Collection>().AttachRange(resource.ExternalIDs);
			}
		}

		/// <inheritdoc />
		protected override async Task EditRelations(Collection resource, Collection changed, bool resetOld)
		{
			await Validate(changed);

			if (changed.ExternalIDs != null || resetOld)
			{
				await Database.Entry(resource).Collection(x => x.ExternalIDs).LoadAsync();
				resource.ExternalIDs = changed.ExternalIDs;
			}
		}

		/// <inheritdoc />
		public override async Task Delete(Collection obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			_database.Entry(obj).State = EntityState.Deleted;
			await _database.SaveChangesAsync();
		}
	}
}
