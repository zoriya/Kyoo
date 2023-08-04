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
using Kyoo.Abstractions.Models.Exceptions;
using Kyoo.Postgresql;
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

		/// <inheritdoc/>
		protected override Sort<Season> DefaultSort => new Sort<Season>.By(x => x.SeasonNumber);

		/// <summary>
		/// Create a new <see cref="SeasonRepository"/>.
		/// </summary>
		/// <param name="database">The database handle that will be used</param>
		/// <param name="shows">A shows repository</param>
		public SeasonRepository(DatabaseContext database,
			IShowRepository shows)
			: base(database)
		{
			_database = database;

			// Edit seasons slugs when the show's slug changes.
			shows.OnEdited += (show) =>
			{
				List<Season> seasons = _database.Seasons.AsTracking().Where(x => x.ShowID == show.ID).ToList();
				foreach (Season season in seasons)
				{
					season.ShowSlug = show.Slug;
					_database.SaveChanges();
					OnResourceEdited(season);
				}
			};
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
			return await Sort(
				_database.Seasons
					.Where(_database.Like<Season>(x => x.Title, $"%{query}%"))
				)
				.Take(20)
				.ToListAsync();
		}

		/// <inheritdoc/>
		public override async Task<Season> Create(Season obj)
		{
			await base.Create(obj);
			obj.ShowSlug = _database.Shows.First(x => x.ID == obj.ShowID).Slug;
			_database.Entry(obj).State = EntityState.Added;
			await _database.SaveChangesAsync(() => Get(obj.ShowID, obj.SeasonNumber));
			OnResourceCreated(obj);
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
		}

		/// <inheritdoc/>
		public override async Task Delete(Season obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			_database.Remove(obj);
			await _database.SaveChangesAsync();
			await base.Delete(obj);
		}
	}
}
