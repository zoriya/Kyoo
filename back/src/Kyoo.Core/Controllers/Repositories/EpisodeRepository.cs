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

namespace Kyoo.Core.Controllers;

/// <summary>
/// A local repository to handle episodes.
/// </summary>
public class EpisodeRepository(
	DatabaseContext database,
	IRepository<Show> shows,
	IThumbnailsManager thumbs
) : LocalRepository<Episode>(database, thumbs)
{
	static EpisodeRepository()
	{
		// Edit episode slugs when the show's slug changes.
		IRepository<Show>.OnEdited += async (show) =>
		{
			await using AsyncServiceScope scope = CoreModule.Services.CreateAsyncScope();
			DatabaseContext database = scope.ServiceProvider.GetRequiredService<DatabaseContext>();
			List<Episode> episodes = await database
				.Episodes.AsTracking()
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

	/// <inheritdoc />
	public override async Task<ICollection<Episode>> Search(
		string query,
		Include<Episode>? include = default
	)
	{
		return await AddIncludes(database.Episodes, include)
			.Where(x => EF.Functions.ILike(x.Name!, $"%{query}%"))
			.Take(20)
			.ToListAsync();
	}

	protected override Task<Episode?> GetDuplicated(Episode item)
	{
		if (item is { SeasonNumber: not null, EpisodeNumber: not null })
			return database.Episodes.FirstOrDefaultAsync(x =>
				x.ShowId == item.ShowId
				&& x.SeasonNumber == item.SeasonNumber
				&& x.EpisodeNumber == item.EpisodeNumber
			);
		return database.Episodes.FirstOrDefaultAsync(x =>
			x.ShowId == item.ShowId && x.AbsoluteNumber == item.AbsoluteNumber
		);
	}

	/// <inheritdoc />
	public override async Task<Episode> Create(Episode obj)
	{
		obj.ShowSlug = obj.Show?.Slug ?? (await shows.Get(obj.ShowId)).Slug;
		await base.Create(obj);
		database.Entry(obj).State = EntityState.Added;
		await database.SaveChangesAsync(() => GetDuplicated(obj));
		await IRepository<Episode>.OnResourceCreated(obj);
		return obj;
	}

	/// <inheritdoc />
	protected override async Task Validate(Episode resource)
	{
		await base.Validate(resource);
		if (resource.ShowId == Guid.Empty)
		{
			if (resource.Show == null)
			{
				throw new ArgumentException(
					$"Can't store an episode not related "
						+ $"to any show (showID: {resource.ShowId})."
				);
			}
			resource.ShowId = resource.Show.Id;
		}
		if (resource.SeasonId == null && resource.SeasonNumber != null)
		{
			resource.Season = await database.Seasons.FirstOrDefaultAsync(x =>
				x.ShowId == resource.ShowId && x.SeasonNumber == resource.SeasonNumber
			);
		}
	}

	/// <inheritdoc />
	public override async Task Delete(Episode obj)
	{
		int epCount = await database
			.Episodes.Where(x => x.ShowId == obj.ShowId)
			.Take(2)
			.CountAsync();
		database.Entry(obj).State = EntityState.Deleted;
		await database.SaveChangesAsync();
		await base.Delete(obj);
		if (epCount == 1)
			await shows.Delete(obj.ShowId);
	}
}
