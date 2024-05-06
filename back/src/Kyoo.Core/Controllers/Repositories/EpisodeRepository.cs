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
using System.ComponentModel.DataAnnotations;
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
	IThumbnailsManager thumbnails
) : GenericRepository<Episode>(database)
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
		return await AddIncludes(Database.Episodes, include)
			.Where(x => EF.Functions.ILike(x.Name!, $"%{query}%"))
			.Take(20)
			.ToListAsync();
	}

	/// <inheritdoc />
	protected override async Task Validate(Episode resource)
	{
		await base.Validate(resource);
		resource.Show = null;
		if (resource.ShowId == Guid.Empty)
			throw new ValidationException("Missing show id");
		// This is storred in db so it needs to be set before every create/edit (and before events)
		resource.ShowSlug = (await shows.Get(resource.ShowId)).Slug;

		resource.Season = null;
		if (resource.SeasonId == null && resource.SeasonNumber != null)
		{
			resource.SeasonId = await Database
				.Seasons.Where(x =>
					x.ShowId == resource.ShowId && x.SeasonNumber == resource.SeasonNumber
				)
				.Select(x => x.Id)
				.FirstOrDefaultAsync();
		}

		resource.NextMetadataRefresh ??= IRefreshable.ComputeNextRefreshDate(
			resource.ReleaseDate ?? DateOnly.FromDateTime(resource.AddedDate)
		);
		await thumbnails.DownloadImages(resource);
	}

	/// <inheritdoc />
	public override async Task Delete(Episode obj)
	{
		int epCount = await Database
			.Episodes.Where(x => x.ShowId == obj.ShowId)
			.Take(2)
			.CountAsync();
		if (epCount == 1)
			await shows.Delete(obj.ShowId);
		else
			await base.Delete(obj);
	}

	/// <inheritdoc/>
	public override async Task DeleteAll(Filter<Episode> filter)
	{
		ICollection<Episode> items = await GetAll(filter);
		Guid[] ids = items.Select(x => x.Id).ToArray();

		await Database.Set<Episode>().Where(x => ids.Contains(x.Id)).ExecuteDeleteAsync();
		foreach (Episode resource in items)
			await IRepository<Episode>.OnResourceDeleted(resource);

		Guid[] showIds = await Database
			.Set<Episode>()
			.Where(filter.ToEfLambda())
			.Select(x => x.Show!)
			.Where(x => !x.Episodes!.Any())
			.Select(x => x.Id)
			.ToArrayAsync();

		if (!showIds.Any())
			return;

		Filter<Show>[] showFilters = showIds
			.Select(x => new Filter<Show>.Eq(nameof(Show.Id), x))
			.ToArray();
		await shows.DeleteAll(Filter.Or(showFilters)!);
	}
}
