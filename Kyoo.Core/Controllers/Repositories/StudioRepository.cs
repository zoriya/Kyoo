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
using Kyoo.Database;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Core.Controllers
{
	/// <summary>
	/// A local repository to handle studios
	/// </summary>
	public class StudioRepository : LocalRepository<Studio>, IStudioRepository
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
		protected override Expression<Func<Studio, object>> DefaultSort => x => x.Name;

		/// <summary>
		/// Create a new <see cref="StudioRepository"/>.
		/// </summary>
		/// <param name="database">The database handle</param>
		/// <param name="providers">A provider repository</param>
		public StudioRepository(DatabaseContext database, IProviderRepository providers)
			: base(database)
		{
			_database = database;
			_providers = providers;
		}

		/// <inheritdoc />
		public override async Task<ICollection<Studio>> Search(string query)
		{
			return await _database.Studios
				.Where(_database.Like<Studio>(x => x.Name, $"%{query}%"))
				.OrderBy(DefaultSort)
				.Take(20)
				.ToListAsync();
		}

		/// <inheritdoc />
		public override async Task<Studio> Create(Studio obj)
		{
			await base.Create(obj);
			_database.Entry(obj).State = EntityState.Added;
			await _database.SaveChangesAsync($"Trying to insert a duplicated studio (slug {obj.Slug} already exists).");
			return obj;
		}

		/// <inheritdoc />
		protected override async Task Validate(Studio resource)
		{
			await base.Validate(resource);
			if (resource.ExternalIDs != null)
			{
				foreach (MetadataID id in resource.ExternalIDs)
				{
					id.Provider = _database.LocalEntity<Provider>(id.Provider.Slug)
						?? await _providers.CreateIfNotExists(id.Provider);
					id.ProviderID = id.Provider.ID;
				}
				_database.MetadataIds<Studio>().AttachRange(resource.ExternalIDs);
			}
		}

		/// <inheritdoc />
		protected override async Task EditRelations(Studio resource, Studio changed, bool resetOld)
		{
			if (changed.ExternalIDs != null || resetOld)
			{
				await Database.Entry(resource).Collection(x => x.ExternalIDs).LoadAsync();
				resource.ExternalIDs = changed.ExternalIDs;
			}

			await base.EditRelations(resource, changed, resetOld);
		}

		/// <inheritdoc />
		public override async Task Delete(Studio obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			_database.Entry(obj).State = EntityState.Deleted;
			await _database.SaveChangesAsync();
		}
	}
}
