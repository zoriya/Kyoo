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
using Kyoo.Core.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using static Kyoo.Abstractions.Models.Utils.Constants;

namespace Kyoo.Core.Api;

/// <summary>
/// Information about one or multiple <see cref="Collection"/>.
/// </summary>
[Route("collections")]
[Route("collection", Order = AlternativeRoute)]
[ApiController]
[PartialPermission(nameof(Collection))]
[ApiDefinition("Collections", Group = ResourcesGroup)]
public class CollectionApi : CrudThumbsApi<Collection>
{
	private readonly ILibraryManager _libraryManager;
	private readonly CollectionRepository _collections;
	private readonly LibraryItemRepository _items;

	public CollectionApi(
		ILibraryManager libraryManager,
		CollectionRepository collections,
		LibraryItemRepository items,
		IThumbnailsManager thumbs
	)
		: base(libraryManager.Collections, thumbs)
	{
		_libraryManager = libraryManager;
		_collections = collections;
		_items = items;
	}

	/// <summary>
	/// Add a movie
	/// </summary>
	/// <remarks>
	/// Add a movie in the collection.
	/// </remarks>
	/// <param name="identifier">The ID or slug of the <see cref="Collection"/>.</param>
	/// <param name="movie">The ID or slug of the <see cref="Movie"/> to add.</param>
	/// <returns>Nothing if successful.</returns>
	/// <response code="404">No collection or movie with the given ID could be found.</response>
	/// <response code="409">The specified movie is already in this collection.</response>
	[HttpPut("{identifier:id}/movies/{movie:id}")]
	[HttpPut("{identifier:id}/movie/{movie:id}", Order = AlternativeRoute)]
	[PartialPermission(Kind.Write)]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	[ProducesResponseType(StatusCodes.Status409Conflict)]
	public async Task<ActionResult> AddMovie(Identifier identifier, Identifier movie)
	{
		Guid collectionId = await identifier.Match(
			async id => (await _libraryManager.Collections.Get(id)).Id,
			async slug => (await _libraryManager.Collections.Get(slug)).Id
		);
		Guid movieId = await movie.Match(
			async id => (await _libraryManager.Movies.Get(id)).Id,
			async slug => (await _libraryManager.Movies.Get(slug)).Id
		);
		await _collections.AddMovie(collectionId, movieId);
		return NoContent();
	}

	/// <summary>
	/// Add a show
	/// </summary>
	/// <remarks>
	/// Add a show in the collection.
	/// </remarks>
	/// <param name="identifier">The ID or slug of the <see cref="Collection"/>.</param>
	/// <param name="show">The ID or slug of the <see cref="Show"/> to add.</param>
	/// <returns>Nothing if successful.</returns>
	/// <response code="404">No collection or show with the given ID could be found.</response>
	/// <response code="409">The specified show is already in this collection.</response>
	[HttpPut("{identifier:id}/shows/{show:id}")]
	[HttpPut("{identifier:id}/show/{show:id}", Order = AlternativeRoute)]
	[PartialPermission(Kind.Write)]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	[ProducesResponseType(StatusCodes.Status409Conflict)]
	public async Task<ActionResult> AddShow(Identifier identifier, Identifier show)
	{
		Guid collectionId = await identifier.Match(
			async id => (await _libraryManager.Collections.Get(id)).Id,
			async slug => (await _libraryManager.Collections.Get(slug)).Id
		);
		Guid showId = await show.Match(
			async id => (await _libraryManager.Shows.Get(id)).Id,
			async slug => (await _libraryManager.Shows.Get(slug)).Id
		);
		await _collections.AddShow(collectionId, showId);
		return NoContent();
	}

	/// <summary>
	/// Get items in collection
	/// </summary>
	/// <remarks>
	/// Lists the items that are contained in the collection with the given id or slug.
	/// </remarks>
	/// <param name="identifier">The ID or slug of the <see cref="Collection"/>.</param>
	/// <param name="sortBy">A key to sort items by.</param>
	/// <param name="filter">An optional list of filters.</param>
	/// <param name="pagination">The number of items to return.</param>
	/// <param name="fields">The aditional fields to include in the result.</param>
	/// <returns>A page of items.</returns>
	/// <response code="400">The filters or the sort parameters are invalid.</response>
	/// <response code="404">No collection with the given ID could be found.</response>
	[HttpGet("{identifier:id}/items")]
	[HttpGet("{identifier:id}/item", Order = AlternativeRoute)]
	[PartialPermission(Kind.Read)]
	[ProducesResponseType(StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	public async Task<ActionResult<Page<ILibraryItem>>> GetItems(
		Identifier identifier,
		[FromQuery] Sort<ILibraryItem> sortBy,
		[FromQuery] Filter<ILibraryItem>? filter,
		[FromQuery] Pagination pagination,
		[FromQuery] Include<ILibraryItem>? fields
	)
	{
		Guid collectionId = await identifier.Match(
			id => Task.FromResult(id),
			async slug => (await _libraryManager.Collections.Get(slug)).Id
		);
		ICollection<ILibraryItem> resources = await _items.GetAllOfCollection(
			collectionId,
			filter,
			sortBy == new Sort<ILibraryItem>.Default()
				? new Sort<ILibraryItem>.By(nameof(Movie.AirDate))
				: sortBy,
			fields,
			pagination
		);

		if (
			!resources.Any()
			&& await _libraryManager.Collections.GetOrDefault(identifier.IsSame<Collection>())
				== null
		)
			return NotFound();
		return Page(resources, pagination.Limit);
	}

	/// <summary>
	/// Get shows in collection
	/// </summary>
	/// <remarks>
	/// Lists the shows that are contained in the collection with the given id or slug.
	/// </remarks>
	/// <param name="identifier">The ID or slug of the <see cref="Collection"/>.</param>
	/// <param name="sortBy">A key to sort shows by.</param>
	/// <param name="filter">An optional list of filters.</param>
	/// <param name="pagination">The number of shows to return.</param>
	/// <param name="fields">The additional fields to include in the result.</param>
	/// <returns>A page of shows.</returns>
	/// <response code="400">The filters or the sort parameters are invalid.</response>
	/// <response code="404">No collection with the given ID could be found.</response>
	[HttpGet("{identifier:id}/shows")]
	[HttpGet("{identifier:id}/show", Order = AlternativeRoute)]
	[PartialPermission(Kind.Read)]
	[ProducesResponseType(StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	public async Task<ActionResult<Page<Show>>> GetShows(
		Identifier identifier,
		[FromQuery] Sort<Show> sortBy,
		[FromQuery] Filter<Show>? filter,
		[FromQuery] Pagination pagination,
		[FromQuery] Include<Show>? fields
	)
	{
		ICollection<Show> resources = await _libraryManager.Shows.GetAll(
			Filter.And(filter, identifier.IsContainedIn<Show, Collection>(x => x.Collections)),
			sortBy == new Sort<Show>.Default() ? new Sort<Show>.By(x => x.AirDate) : sortBy,
			fields,
			pagination
		);

		if (
			!resources.Any()
			&& await _libraryManager.Collections.GetOrDefault(identifier.IsSame<Collection>())
				== null
		)
			return NotFound();
		return Page(resources, pagination.Limit);
	}

	/// <summary>
	/// Get movies in collection
	/// </summary>
	/// <remarks>
	/// Lists the movies that are contained in the collection with the given id or slug.
	/// </remarks>
	/// <param name="identifier">The ID or slug of the <see cref="Collection"/>.</param>
	/// <param name="sortBy">A key to sort movies by.</param>
	/// <param name="filter">An optional list of filters.</param>
	/// <param name="pagination">The number of movies to return.</param>
	/// <param name="fields">The aditional fields to include in the result.</param>
	/// <returns>A page of movies.</returns>
	/// <response code="400">The filters or the sort parameters are invalid.</response>
	/// <response code="404">No collection with the given ID could be found.</response>
	[HttpGet("{identifier:id}/movies")]
	[HttpGet("{identifier:id}/movie", Order = AlternativeRoute)]
	[PartialPermission(Kind.Read)]
	[ProducesResponseType(StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	public async Task<ActionResult<Page<Movie>>> GetMovies(
		Identifier identifier,
		[FromQuery] Sort<Movie> sortBy,
		[FromQuery] Filter<Movie>? filter,
		[FromQuery] Pagination pagination,
		[FromQuery] Include<Movie>? fields
	)
	{
		ICollection<Movie> resources = await _libraryManager.Movies.GetAll(
			Filter.And(filter, identifier.IsContainedIn<Movie, Collection>(x => x.Collections)),
			sortBy == new Sort<Movie>.Default() ? new Sort<Movie>.By(x => x.AirDate) : sortBy,
			fields,
			pagination
		);

		if (
			!resources.Any()
			&& await _libraryManager.Collections.GetOrDefault(identifier.IsSame<Collection>())
				== null
		)
			return NotFound();
		return Page(resources, pagination.Limit);
	}
}
