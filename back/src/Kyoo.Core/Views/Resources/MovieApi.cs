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
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Abstractions.Models.Permissions;
using Kyoo.Abstractions.Models.Utils;
using Kyoo.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using static Kyoo.Abstractions.Models.Utils.Constants;

namespace Kyoo.Core.Api;

/// <summary>
/// Information about one or multiple <see cref="Movie"/>.
/// </summary>
[Route("movies")]
[Route("movie", Order = AlternativeRoute)]
[ApiController]
[PartialPermission(nameof(Movie))]
[ApiDefinition("Movie", Group = ResourcesGroup)]
public class MovieApi(ILibraryManager libraryManager) : TranscoderApi<Movie>(libraryManager.Movies)
{
	/// <summary>
	/// Refresh
	/// </summary>
	/// <remarks>
	/// Ask a metadata refresh.
	/// </remarks>
	/// <param name="identifier">The ID or slug of the <see cref="Movie"/>.</param>
	/// <returns>Nothing</returns>
	/// <response code="404">No episode with the given ID or slug could be found.</response>
	[HttpPost("{identifier:id}/refresh")]
	[PartialPermission(Kind.Write)]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	public async Task<ActionResult> Refresh(Identifier identifier, [FromServices] IScanner scanner)
	{
		Guid id = await identifier.Match(
			id => Task.FromResult(id),
			async slug => (await libraryManager.Movies.Get(slug)).Id
		);
		await scanner.SendRefreshRequest(nameof(Movie), id);
		return NoContent();
	}

	/// <summary>
	/// Get studio that made the show
	/// </summary>
	/// <remarks>
	/// Get the studio that made the show.
	/// </remarks>
	/// <param name="identifier">The ID or slug of the <see cref="Show"/>.</param>
	/// <param name="fields">The aditional fields to include in the result.</param>
	/// <returns>The studio that made the show.</returns>
	/// <response code="404">No show with the given ID or slug could be found.</response>
	[HttpGet("{identifier:id}/studio")]
	[PartialPermission(Kind.Read)]
	[ProducesResponseType(StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	public async Task<ActionResult<Studio>> GetStudio(
		Identifier identifier,
		[FromQuery] Include<Studio> fields
	)
	{
		return await libraryManager.Studios.Get(
			identifier.IsContainedIn<Studio, Movie>(x => x.Movies!),
			fields
		);
	}

	/// <summary>
	/// Get collections containing this show
	/// </summary>
	/// <remarks>
	/// List the collections that contain this show.
	/// </remarks>
	/// <param name="identifier">The ID or slug of the <see cref="Movie"/>.</param>
	/// <param name="sortBy">A key to sort collections by.</param>
	/// <param name="filter">An optional list of filters.</param>
	/// <param name="pagination">The number of collections to return.</param>
	/// <param name="fields">The aditional fields to include in the result.</param>
	/// <returns>A page of collections.</returns>
	/// <response code="400">The filters or the sort parameters are invalid.</response>
	/// <response code="404">No show with the given ID or slug could be found.</response>
	[HttpGet("{identifier:id}/collections")]
	[HttpGet("{identifier:id}/collection", Order = AlternativeRoute)]
	[PartialPermission(Kind.Read)]
	[ProducesResponseType(StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	public async Task<ActionResult<Page<Collection>>> GetCollections(
		Identifier identifier,
		[FromQuery] Sort<Collection> sortBy,
		[FromQuery] Filter<Collection>? filter,
		[FromQuery] Pagination pagination,
		[FromQuery] Include<Collection> fields
	)
	{
		ICollection<Collection> resources = await libraryManager.Collections.GetAll(
			Filter.And(filter, identifier.IsContainedIn<Collection, Movie>(x => x.Movies)),
			sortBy,
			fields,
			pagination
		);

		if (
			!resources.Any()
			&& await libraryManager.Movies.GetOrDefault(identifier.IsSame<Movie>()) == null
		)
			return NotFound();
		return Page(resources, pagination.Limit);
	}

	/// <summary>
	/// Get watch status
	/// </summary>
	/// <remarks>
	/// Get when an item has been wathed and if it was watched.
	/// </remarks>
	/// <param name="identifier">The ID or slug of the <see cref="Movie"/>.</param>
	/// <returns>The status.</returns>
	/// <response code="204">This movie does not have a specific status.</response>
	/// <response code="404">No movie with the given ID or slug could be found.</response>
	[HttpGet("{identifier:id}/watchStatus")]
	[UserOnly]
	[ProducesResponseType(StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	public async Task<MovieWatchStatus?> GetWatchStatus(Identifier identifier)
	{
		Guid id = await identifier.Match(
			id => Task.FromResult(id),
			async slug => (await libraryManager.Movies.Get(slug)).Id
		);
		return await libraryManager.WatchStatus.GetMovieStatus(id, User.GetIdOrThrow());
	}

	/// <summary>
	/// Set watch status
	/// </summary>
	/// <remarks>
	/// Set when an item has been wathed and if it was watched.
	/// </remarks>
	/// <param name="identifier">The ID or slug of the <see cref="Movie"/>.</param>
	/// <param name="status">The new watch status.</param>
	/// <param name="watchedTime">Where the user stopped watching.</param>
	/// <param name="percent">Where the user stopped watching (in percent).</param>
	/// <returns>The newly set status.</returns>
	/// <response code="200">The status has been set</response>
	/// <response code="204">The status was not considered impactfull enough to be saved (less then 5% of watched for example).</response>
	/// <response code="400">WatchedTime can't be specified if status is not watching.</response>
	/// <response code="404">No movie with the given ID or slug could be found.</response>
	[HttpPost("{identifier:id}/watchStatus")]
	[UserOnly]
	[ProducesResponseType(StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	public async Task<MovieWatchStatus?> SetWatchStatus(
		Identifier identifier,
		WatchStatus status,
		int? watchedTime,
		int? percent
	)
	{
		Guid id = await identifier.Match(
			id => Task.FromResult(id),
			async slug => (await libraryManager.Movies.Get(slug)).Id
		);
		return await libraryManager.WatchStatus.SetMovieStatus(
			id,
			User.GetIdOrThrow(),
			status,
			watchedTime,
			percent
		);
	}

	/// <summary>
	/// Delete watch status
	/// </summary>
	/// <remarks>
	/// Delete watch status (to rewatch for example).
	/// </remarks>
	/// <param name="identifier">The ID or slug of the <see cref="Movie"/>.</param>
	/// <returns>The newly set status.</returns>
	/// <response code="204">The status has been deleted.</response>
	/// <response code="404">No movie with the given ID or slug could be found.</response>
	[HttpDelete("{identifier:id}/watchStatus")]
	[UserOnly]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	public async Task DeleteWatchStatus(Identifier identifier)
	{
		Guid id = await identifier.Match(
			id => Task.FromResult(id),
			async slug => (await libraryManager.Movies.Get(slug)).Id
		);
		await libraryManager.WatchStatus.DeleteMovieStatus(id, User.GetIdOrThrow());
	}

	protected override async Task<string> GetPath(Identifier identifier)
	{
		string path = await identifier.Match(
			async id => (await Repository.Get(id)).Path,
			async slug => (await Repository.Get(slug)).Path
		);
		return path;
	}
}
