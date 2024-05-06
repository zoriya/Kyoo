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

public class SeasonRepository(
	DatabaseContext database,
	IRepository<Show> shows,
	IThumbnailsManager thumbnails
) : GenericRepository<Season>(database)
{
	static SeasonRepository()
	{
		// Edit seasons slugs when the show's slug changes.
		IRepository<Show>.OnEdited += async (show) =>
		{
			await using AsyncServiceScope scope = CoreModule.Services.CreateAsyncScope();
			DatabaseContext database = scope.ServiceProvider.GetRequiredService<DatabaseContext>();
			List<Season> seasons = await database
				.Seasons.AsTracking()
				.Where(x => x.ShowId == show.Id)
				.ToListAsync();
			foreach (Season season in seasons)
			{
				season.ShowSlug = show.Slug;
				await database.SaveChangesAsync();
				await IRepository<Season>.OnResourceEdited(season);
			}
		};
	}

	/// <inheritdoc/>
	public override async Task<ICollection<Season>> Search(
		string query,
		Include<Season>? include = default
	)
	{
		return await AddIncludes(Database.Seasons, include)
			.Where(x => EF.Functions.ILike(x.Name!, $"%{query}%"))
			.Take(20)
			.ToListAsync();
	}

	/// <inheritdoc/>
	protected override async Task Validate(Season resource)
	{
		await base.Validate(resource);
		resource.Show = null;
		if (resource.ShowId == Guid.Empty)
			throw new ValidationException("Missing show id");
		// This is storred in db so it needs to be set before every create/edit (and before events)
		resource.ShowSlug = (await shows.Get(resource.ShowId)).Slug;
		resource.NextMetadataRefresh ??= IRefreshable.ComputeNextRefreshDate(
			resource.StartDate ?? DateOnly.FromDateTime(resource.AddedDate)
		);
		await thumbnails.DownloadImages(resource);
	}
}
