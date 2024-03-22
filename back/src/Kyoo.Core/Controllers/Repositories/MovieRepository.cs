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
/// A local repository to handle shows
/// </summary>
public class MovieRepository : LocalRepository<Movie>
{
	/// <summary>
	/// The database handle
	/// </summary>
	private readonly DatabaseContext _database;

	/// <summary>
	/// A studio repository to handle creation/validation of related studios.
	/// </summary>
	private readonly IRepository<Studio> _studios;

	public MovieRepository(
		DatabaseContext database,
		IRepository<Studio> studios,
		IThumbnailsManager thumbs
	)
		: base(database, thumbs)
	{
		_database = database;
		_studios = studios;
	}

	/// <inheritdoc />
	public override async Task<ICollection<Movie>> Search(
		string query,
		Include<Movie>? include = default
	)
	{
		return await AddIncludes(_database.Movies, include)
			.Where(x => EF.Functions.ILike(x.Name + " " + x.Slug, $"%{query}%"))
			.Take(20)
			.ToListAsync();
	}

	/// <inheritdoc />
	public override async Task<Movie> Create(Movie obj)
	{
		await base.Create(obj);
		_database.Entry(obj).State = EntityState.Added;
		await _database.SaveChangesAsync(() => Get(obj.Slug));
		await IRepository<Movie>.OnResourceCreated(obj);
		return obj;
	}

	/// <inheritdoc />
	protected override async Task Validate(Movie resource)
	{
		await base.Validate(resource);
		if (resource.Studio != null)
		{
			resource.Studio = await _studios.CreateIfNotExists(resource.Studio);
			resource.StudioId = resource.Studio.Id;
		}
	}

	/// <inheritdoc />
	protected override async Task EditRelations(Movie resource, Movie changed)
	{
		await Validate(changed);

		if (changed.Studio != null || changed.StudioId == null)
		{
			await Database.Entry(resource).Reference(x => x.Studio).LoadAsync();
			resource.Studio = changed.Studio;
		}
	}

	/// <inheritdoc />
	public override async Task Delete(Movie obj)
	{
		_database.Remove(obj);
		await _database.SaveChangesAsync();
		await base.Delete(obj);
	}
}
