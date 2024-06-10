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

using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Abstractions.Models.Permissions;
using Kyoo.Abstractions.Models.Utils;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using static Kyoo.Abstractions.Models.Utils.Constants;

namespace Kyoo.Core.Api;

/// <summary>
/// An endpoint to search for every resources of kyoo. Searching for only a specific type of resource
/// is available on the said endpoint.
/// </summary>
[Route("search")]
[ApiController]
[ApiDefinition("Search", Group = OtherGroup)]
public class SearchApi : BaseApi
{
	private readonly ISearchManager _searchManager;

	public SearchApi(ISearchManager searchManager)
	{
		_searchManager = searchManager;
	}

	// TODO: add facets

	/// <summary>
	/// Search collections
	/// </summary>
	/// <remarks>
	/// Search for collections
	/// </remarks>
	/// <param name="q">The query to search for.</param>
	/// <param name="sortBy">Sort information about the query (sort by, sort order).</param>
	/// <param name="pagination">How many items per page should be returned, where should the page start...</param>
	/// <param name="fields">The aditional fields to include in the result.</param>
	/// <returns>A list of collections found for the specified query.</returns>
	[HttpGet("collections")]
	[HttpGet("collection", Order = AlternativeRoute)]
	[Permission(nameof(Collection), Kind.Read)]
	[ApiDefinition("Collections", Group = ResourcesGroup)]
	[ProducesResponseType(StatusCodes.Status200OK)]
	public async Task<SearchPage<Collection>> SearchCollections(
		[FromQuery] string? q,
		[FromQuery] Sort<Collection> sortBy,
		[FromQuery] Filter<ILibraryItem>? filter,
		[FromQuery] SearchPagination pagination,
		[FromQuery] Include<Collection> fields
	)
	{
		return SearchPage(
			await _searchManager.SearchCollections(q, sortBy, filter, pagination, fields)
		);
	}

	/// <summary>
	/// Search shows
	/// </summary>
	/// <remarks>
	/// Search for shows
	/// </remarks>
	/// <param name="q">The query to search for.</param>
	/// <param name="sortBy">Sort information about the query (sort by, sort order).</param>
	/// <param name="pagination">How many items per page should be returned, where should the page start...</param>
	/// <param name="fields">The aditional fields to include in the result.</param>
	/// <returns>A list of shows found for the specified query.</returns>
	[HttpGet("shows")]
	[HttpGet("show", Order = AlternativeRoute)]
	[Permission(nameof(Show), Kind.Read)]
	[ApiDefinition("Shows", Group = ResourcesGroup)]
	[ProducesResponseType(StatusCodes.Status200OK)]
	public async Task<SearchPage<Show>> SearchShows(
		[FromQuery] string? q,
		[FromQuery] Sort<Show> sortBy,
		[FromQuery] Filter<ILibraryItem>? filter,
		[FromQuery] SearchPagination pagination,
		[FromQuery] Include<Show> fields
	)
	{
		return SearchPage(await _searchManager.SearchShows(q, sortBy, filter, pagination, fields));
	}

	/// <summary>
	/// Search movie
	/// </summary>
	/// <remarks>
	/// Search for movie
	/// </remarks>
	/// <param name="q">The query to search for.</param>
	/// <param name="sortBy">Sort information about the query (sort by, sort order).</param>
	/// <param name="pagination">How many items per page should be returned, where should the page start...</param>
	/// <param name="fields">The aditional fields to include in the result.</param>
	/// <returns>A list of movies found for the specified query.</returns>
	[HttpGet("movies")]
	[HttpGet("movie", Order = AlternativeRoute)]
	[Permission(nameof(Movie), Kind.Read)]
	[ApiDefinition("Movies", Group = ResourcesGroup)]
	[ProducesResponseType(StatusCodes.Status200OK)]
	public async Task<SearchPage<Movie>> SearchMovies(
		[FromQuery] string? q,
		[FromQuery] Sort<Movie> sortBy,
		[FromQuery] Filter<ILibraryItem>? filter,
		[FromQuery] SearchPagination pagination,
		[FromQuery] Include<Movie> fields
	)
	{
		return SearchPage(await _searchManager.SearchMovies(q, sortBy, filter, pagination, fields));
	}

	/// <summary>
	/// Search items
	/// </summary>
	/// <remarks>
	/// Search for items
	/// </remarks>
	/// <param name="q">The query to search for.</param>
	/// <param name="sortBy">Sort information about the query (sort by, sort order).</param>
	/// <param name="pagination">How many items per page should be returned, where should the page start...</param>
	/// <param name="fields">The aditional fields to include in the result.</param>
	/// <returns>A list of items found for the specified query.</returns>
	[HttpGet("items")]
	[HttpGet("item", Order = AlternativeRoute)]
	[Permission(nameof(ILibraryItem), Kind.Read)]
	[ApiDefinition("Items", Group = ResourcesGroup)]
	[ProducesResponseType(StatusCodes.Status200OK)]
	public async Task<SearchPage<ILibraryItem>> SearchItems(
		[FromQuery] string? q,
		[FromQuery] Sort<ILibraryItem> sortBy,
		[FromQuery] Filter<ILibraryItem>? filter,
		[FromQuery] SearchPagination pagination,
		[FromQuery] Include<ILibraryItem> fields
	)
	{
		return SearchPage(await _searchManager.SearchItems(q, sortBy, filter, pagination, fields));
	}

	/// <summary>
	/// Search episodes
	/// </summary>
	/// <remarks>
	/// Search for episodes
	/// </remarks>
	/// <param name="q">The query to search for.</param>
	/// <param name="sortBy">Sort information about the query (sort by, sort order).</param>
	/// <param name="pagination">How many items per page should be returned, where should the page start...</param>
	/// <param name="fields">The aditional fields to include in the result.</param>
	/// <returns>A list of episodes found for the specified query.</returns>
	[HttpGet("episodes")]
	[HttpGet("episode", Order = AlternativeRoute)]
	[Permission(nameof(Episode), Kind.Read)]
	[ApiDefinition("Episodes", Group = ResourcesGroup)]
	[ProducesResponseType(StatusCodes.Status200OK)]
	public async Task<SearchPage<Episode>> SearchEpisodes(
		[FromQuery] string? q,
		[FromQuery] Sort<Episode> sortBy,
		[FromQuery] Filter<Episode>? filter,
		[FromQuery] SearchPagination pagination,
		[FromQuery] Include<Episode> fields
	)
	{
		return SearchPage(
			await _searchManager.SearchEpisodes(q, sortBy, filter, pagination, fields)
		);
	}

	/// <summary>
	/// Search studios
	/// </summary>
	/// <remarks>
	/// Search for studios
	/// </remarks>
	/// <param name="q">The query to search for.</param>
	/// <param name="sortBy">Sort information about the query (sort by, sort order).</param>
	/// <param name="pagination">How many items per page should be returned, where should the page start...</param>
	/// <param name="fields">The aditional fields to include in the result.</param>
	/// <returns>A list of studios found for the specified query.</returns>
	[HttpGet("studios")]
	[HttpGet("studio", Order = AlternativeRoute)]
	[Permission(nameof(Studio), Kind.Read)]
	[ApiDefinition("Studios", Group = MetadataGroup)]
	[ProducesResponseType(StatusCodes.Status200OK)]
	public async Task<SearchPage<Studio>> SearchStudios(
		[FromQuery] string? q,
		[FromQuery] Sort<Studio> sortBy,
		[FromQuery] Filter<Studio>? filter,
		[FromQuery] SearchPagination pagination,
		[FromQuery] Include<Studio> fields
	)
	{
		return SearchPage(
			await _searchManager.SearchStudios(q, sortBy, filter, pagination, fields)
		);
	}
}
