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
using Kyoo.Abstractions.Models.Utils;
using Kyoo.Postgresql;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Kyoo.Core.Controllers
{
	/// <summary>
	/// A local repository to handle episodes.
	/// </summary>
	public class EpisodeRepository : LocalRepository<Episode>
	{
		/// <summary>
		/// The database handle
		/// </summary>
		private readonly DatabaseContext _database;

		private readonly IRepository<Show> _shows;

		static EpisodeRepository()
		{
			// Edit episode slugs when the show's slug changes.
			IRepository<Show>.OnEdited += async (show) =>
			{
				await using AsyncServiceScope scope = CoreModule.Services.CreateAsyncScope();
				DatabaseContext database = scope.ServiceProvider.GetRequiredService<DatabaseContext>();
				List<Episode> episodes = await database.Episodes.AsTracking()
					.Where(x => x.ShowId == show.Id)
					.ToListAsync();
				foreach (Episode ep in episodes)
				{
					ep.ShowSlug = show.Slug;
					await database.SaveChangesAsync();
					await IRepository<Episode>.OnResourceEdited(ep);
				}
			};
		}

		/// <summary>
		/// Create a new <see cref="EpisodeRepository"/>.
		/// </summary>
		/// <param name="database">The database handle to use.</param>
		/// <param name="shows">A show repository</param>
		/// <param name="thumbs">The thumbnail manager used to store images.</param>
		public EpisodeRepository(DatabaseContext database,
			IRepository<Show> shows,
			IThumbnailsManager thumbs)
			: base(database, thumbs)
		{
			_database = database;
			_shows = shows;
		}

		/// <inheritdoc />
		public override async Task<ICollection<Episode>> Search(string query, Include<Episode>? include = default)
		{
			return await AddIncludes(_database.Episodes, include)
				.Where(x => EF.Functions.ILike(x.Name!, $"%{query}%"))
				.Take(20)
				.ToListAsync();
		}

		/// <inheritdoc />
		public override async Task<Episode> Create(Episode obj)
		{
			obj.ShowSlug = obj.Show?.Slug ?? (await _database.Shows.FirstAsync(x => x.Id == obj.ShowId)).Slug;
			await base.Create(obj);
			_database.Entry(obj).State = EntityState.Added;
			await _database.SaveChangesAsync(() =>
				obj is { SeasonNumber: not null, EpisodeNumber: not null }
				? _database.Episodes.FirstOrDefaultAsync(x => x.ShowId == obj.ShowId && x.SeasonNumber == obj.SeasonNumber && x.EpisodeNumber == obj.EpisodeNumber)
				: _database.Episodes.FirstOrDefaultAsync(x => x.ShowId == obj.ShowId && x.AbsoluteNumber == obj.AbsoluteNumber));
			await IRepository<Episode>.OnResourceCreated(obj);
			return obj;
		}

		/// <inheritdoc />
		protected override async Task Validate(Episode resource)
		{
			await base.Validate(resource);
			if (resource.ShowId <= 0)
			{
				if (resource.Show == null)
				{
					throw new ArgumentException($"Can't store an episode not related " +
						$"to any show (showID: {resource.ShowId}).");
				}
				resource.ShowId = resource.Show.Id;
			}
			if (resource.SeasonId == null && resource.SeasonNumber != null)
			{
				resource.Season = await _database.Seasons.FirstOrDefaultAsync(x => x.ShowId == resource.ShowId
					&& x.SeasonNumber == resource.SeasonNumber);
			}
		}

		/// <inheritdoc />
		public override async Task Delete(Episode obj)
		{
			int epCount = await _database.Episodes.Where(x => x.ShowId == obj.ShowId).Take(2).CountAsync();
			_database.Entry(obj).State = EntityState.Deleted;
			await _database.SaveChangesAsync();
			await base.Delete(obj);
			if (epCount == 1)
				await _shows.Delete(obj.ShowId);
		}
	}
}
