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
using Kyoo.Abstractions.Models.Utils;
using Kyoo.Postgresql;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Core.Controllers;

public class ShowRepository(
	DatabaseContext database,
	IRepository<Studio> studios,
	IThumbnailsManager thumbnails
) : GenericRepository<Show>(database)
{
	/// <inheritdoc />
	public override async Task<ICollection<Show>> Search(
		string query,
		Include<Show>? include = default
	)
	{
		return await AddIncludes(Database.Shows, include)
			.Where(x => EF.Functions.ILike(x.Name + " " + x.Slug, $"%{query}%"))
			.Take(20)
			.ToListAsync();
	}

	/// <inheritdoc />
	public override Task<Show> Create(Show obj)
	{
		try
		{
			return base.Create(obj);
		}
		catch (DuplicatedItemException ex)
			when (ex.Existing is Show existing
				&& existing.Slug == obj.Slug
				&& obj.StartAir is not null
				&& existing.StartAir?.Year != obj.StartAir?.Year
			)
		{
			obj.Slug = $"{obj.Slug}-{obj.AirDate!.Value.Year}";
			return base.Create(obj);
		}
	}

	/// <inheritdoc />
	protected override async Task Validate(Show resource)
	{
		await base.Validate(resource);
		if (resource.Studio != null)
		{
			resource.StudioId = (await studios.CreateIfNotExists(resource.Studio)).Id;
			resource.Studio = null;
		}
		resource.NextMetadataRefresh ??= IRefreshable.ComputeNextRefreshDate(
			resource.StartAir ?? DateOnly.FromDateTime(resource.AddedDate)
		);
		await thumbnails.DownloadImages(resource);
	}
}
