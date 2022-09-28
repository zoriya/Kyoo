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
using Kyoo.Abstractions.Models.Exceptions;
using Kyoo.Database;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Core.Controllers
{
	/// <summary>
	/// A local repository to handle seasons.
	/// </summary>
	public class SeasonRepository : LocalRepository<Season>, ISeasonRepository
	{
		/// <summary>
		/// The database handle
		/// </summary>
		private readonly DatabaseContext _database;

		/// <summary>
		/// A provider repository to handle externalID creation and deletion
		/// </summary>
		private readonly IProviderRepository _providers;

		/// <inheritdoc/>
		protected override Expression<Func<Season, object>> DefaultSort => x => x.SeasonNumber;

		/// <summary>
		/// Create a new <see cref="SeasonRepository"/>.
		/// </summary>
		/// <param name="database">The database handle that will be used</param>
		/// <param name="providers">A provider repository</param>
		public SeasonRepository(DatabaseContext database,
			IProviderRepository providers)
			: base(database)
		{
			_database = database;
			_providers = providers;
		}

		/// <inheritdoc/>
		public async Task<Season> Get(int showID, int seasonNumber)
		{
			Season ret = await GetOrDefault(showID, seasonNumber);
			if (ret == null)
				throw new ItemNotFoundException($"No season {seasonNumber} found for the show {showID}");
			return ret;
		}

		/// <inheritdoc/>
		public async Task<Season> Get(string showSlug, int seasonNumber)
		{
			Season ret = await GetOrDefault(showSlug, seasonNumber);
			if (ret == null)
				throw new ItemNotFoundException($"No season {seasonNumber} found for the show {showSlug}");
			return ret;
		}

		/// <inheritdoc/>
		public Task<Season> GetOrDefault(int showID, int seasonNumber)
		{
			return _database.Seasons.FirstOrDefaultAsync(x => x.ShowID == showID
				&& x.SeasonNumber == seasonNumber);
		}

		/// <inheritdoc/>
		public Task<Season> GetOrDefault(string showSlug, int seasonNumber)
		{
			return _database.Seasons.FirstOrDefaultAsync(x => x.Show.Slug == showSlug
				&& x.SeasonNumber == seasonNumber);
		}

		/// <inheritdoc/>
		public override async Task<ICollection<Season>> Search(string query)
		{
			return await _database.Seasons
				.Where(_database.Like<Season>(x => x.Title, $"%{query}%"))
				.OrderBy(DefaultSort)
				.Take(20)
				.ToListAsync();
		}

		/// <inheritdoc/>
		public override async Task<Season> Create(Season obj)
		{
			await base.Create(obj);
			_database.Entry(obj).State = EntityState.Added;
			await _database.SaveChangesAsync($"Trying to insert a duplicated season (slug {obj.Slug} already exists).");
			return obj;
		}

		/// <inheritdoc/>
		protected override async Task Validate(Season resource)
		{
			await base.Validate(resource);
			if (resource.ShowID <= 0)
			{
				if (resource.Show == null)
				{
					throw new ArgumentException($"Can't store a season not related to any show " +
						$"(showID: {resource.ShowID}).");
				}
				resource.ShowID = resource.Show.ID;
			}

			if (resource.ExternalIDs != null)
			{
				foreach (MetadataID id in resource.ExternalIDs)
				{
					id.Provider = _database.LocalEntity<Provider>(id.Provider.Slug)
						?? await _providers.CreateIfNotExists(id.Provider);
					id.ProviderID = id.Provider.ID;
				}
				_database.MetadataIds<Season>().AttachRange(resource.ExternalIDs);
			}
		}

		/// <inheritdoc/>
		protected override async Task EditRelations(Season resource, Season changed, bool resetOld)
		{
			await Validate(changed);

			if (changed.ExternalIDs != null || resetOld)
			{
				await Database.Entry(resource).Collection(x => x.ExternalIDs).LoadAsync();
				resource.ExternalIDs = changed.ExternalIDs;
			}
		}

		/// <inheritdoc/>
		public override async Task Delete(Season obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			_database.Remove(obj);
			await _database.SaveChangesAsync();
		}
	}
}
