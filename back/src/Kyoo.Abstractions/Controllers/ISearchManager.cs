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
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Utils;

namespace Kyoo.Abstractions.Controllers;

/// <summary>
/// The service to search items.
/// </summary>
public interface ISearchManager
{
	/// <summary>
	/// Search for items.
	/// </summary>
	/// <param name="query">The seach query.</param>
	/// <param name="sortBy">Sort information about the query (sort by, sort order)</param>
	/// <param name="pagination">How pagination should be done (where to start and how many to return)</param>
	/// <param name="include">The related fields to include.</param>
	/// <returns>A list of resources that match every filters</returns>
	public Task<SearchPage<ILibraryItem>.SearchResult> SearchItems(
		string? query,
		Sort<ILibraryItem> sortBy,
		Filter<ILibraryItem>? filter,
		SearchPagination pagination,
		Include<ILibraryItem>? include = default
	);

	/// <summary>
	/// Search for movies.
	/// </summary>
	/// <param name="query">The seach query.</param>
	/// <param name="sortBy">Sort information about the query (sort by, sort order)</param>
	/// <param name="pagination">How pagination should be done (where to start and how many to return)</param>
	/// <param name="include">The related fields to include.</param>
	/// <returns>A list of resources that match every filters</returns>
	public Task<SearchPage<Movie>.SearchResult> SearchMovies(
		string? query,
		Sort<Movie> sortBy,
		Filter<ILibraryItem>? filter,
		SearchPagination pagination,
		Include<Movie>? include = default
	);

	/// <summary>
	/// Search for shows.
	/// </summary>
	/// <param name="query">The seach query.</param>
	/// <param name="sortBy">Sort information about the query (sort by, sort order)</param>
	/// <param name="pagination">How pagination should be done (where to start and how many to return)</param>
	/// <param name="include">The related fields to include.</param>
	/// <returns>A list of resources that match every filters</returns>
	public Task<SearchPage<Show>.SearchResult> SearchShows(
		string? query,
		Sort<Show> sortBy,
		Filter<ILibraryItem>? filter,
		SearchPagination pagination,
		Include<Show>? include = default
	);

	/// <summary>
	/// Search for collections.
	/// </summary>
	/// <param name="query">The seach query.</param>
	/// <param name="sortBy">Sort information about the query (sort by, sort order)</param>
	/// <param name="pagination">How pagination should be done (where to start and how many to return)</param>
	/// <param name="include">The related fields to include.</param>
	/// <returns>A list of resources that match every filters</returns>
	public Task<SearchPage<Collection>.SearchResult> SearchCollections(
		string? query,
		Sort<Collection> sortBy,
		Filter<ILibraryItem>? filter,
		SearchPagination pagination,
		Include<Collection>? include = default
	);

	/// <summary>
	/// Search for episodes.
	/// </summary>
	/// <param name="query">The seach query.</param>
	/// <param name="sortBy">Sort information about the query (sort by, sort order)</param>
	/// <param name="pagination">How pagination should be done (where to start and how many to return)</param>
	/// <param name="include">The related fields to include.</param>
	/// <returns>A list of resources that match every filters</returns>
	public Task<SearchPage<Episode>.SearchResult> SearchEpisodes(
		string? query,
		Sort<Episode> sortBy,
		Filter<Episode>? filter,
		SearchPagination pagination,
		Include<Episode>? include = default
	);

	/// <summary>
	/// Search for studios.
	/// </summary>
	/// <param name="query">The seach query.</param>
	/// <param name="sortBy">Sort information about the query (sort by, sort order)</param>
	/// <param name="pagination">How pagination should be done (where to start and how many to return)</param>
	/// <param name="include">The related fields to include.</param>
	/// <returns>A list of resources that match every filters</returns>
	public Task<SearchPage<Studio>.SearchResult> SearchStudios(
		string? query,
		Sort<Studio> sortBy,
		Filter<Studio>? filter,
		SearchPagination pagination,
		Include<Studio>? include = default
	);
}
