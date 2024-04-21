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

namespace Kyoo.Core.Controllers;

/// <summary>
/// A local repository to handle collections
/// </summary>
public class CollectionRepository(DatabaseContext database, IThumbnailsManager thumbnails)
	: GenericRepository<Collection>(database)
{
	/// <inheritdoc />
	public override async Task<ICollection<Collection>> Search(
		string query,
		Include<Collection>? include = default
	)
	{
		return await AddIncludes(Database.Collections, include)
			.Where(x => EF.Functions.ILike(x.Name + " " + x.Slug, $"%{query}%"))
			.Take(20)
			.ToListAsync();
	}

	/// <inheritdoc />
	protected override async Task Validate(Collection resource)
	{
		await base.Validate(resource);

		if (string.IsNullOrEmpty(resource.Name))
			throw new ArgumentException("The collection's name must be set and not empty");
		await thumbnails.DownloadImages(resource);
	}

	public async Task AddMovie(Guid id, Guid movieId)
	{
		Database.AddLinks<Collection, Movie>(id, movieId);
		await Database.SaveChangesAsync();
	}

	public async Task AddShow(Guid id, Guid showId)
	{
		Database.AddLinks<Collection, Show>(id, showId);
		await Database.SaveChangesAsync();
	}
}
