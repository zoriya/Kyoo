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

using System.ComponentModel.DataAnnotations;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Utils;
using Meilisearch;
using static System.Text.Json.JsonNamingPolicy;

namespace Kyoo.Meiliseach;

public class SearchManager : ISearchManager
{
	private readonly MeilisearchClient _client;
	private readonly ILibraryManager _libraryManager;

	private static IEnumerable<string> _GetSortsBy<T>(string index, Sort<T>? sort)
		where T : IQuery
	{
		return sort switch
		{
			Sort<T>.Default => Array.Empty<string>(),
			Sort<T>.By @sortBy
				=> MeilisearchModule
					.IndexSettings[index]
					.SortableAttributes.Contains(
						sortBy.Key,
						StringComparer.InvariantCultureIgnoreCase
					)
					? new[]
					{
						$"{CamelCase.ConvertName(sortBy.Key)}:{(sortBy.Desendant ? "desc" : "asc")}"
					}
					: throw new ValidationException($"Invalid sorting mode: {sortBy.Key}"),
			Sort<T>.Conglomerate(var list) => list.SelectMany(x => _GetSortsBy(index, x)),
			Sort<T>.Random
				=> throw new ValidationException(
					"Random sorting is not supported while searching."
				),
			_ => Array.Empty<string>(),
		};
	}

	public SearchManager(MeilisearchClient client, ILibraryManager libraryManager)
	{
		_client = client;
		_libraryManager = libraryManager;
	}

	private async Task<SearchPage<T>.SearchResult> _Search<T>(
		string index,
		string? query,
		string? where = null,
		Sort<T>? sortBy = default,
		SearchPagination? pagination = default,
		Include<T>? include = default
	)
		where T : class, IResource, IQuery
	{
		// TODO: add filters and facets
		ISearchable<IdResource> res = await _client
			.Index(index)
			.SearchAsync<IdResource>(
				query,
				new SearchQuery()
				{
					Filter = where,
					Sort = _GetSortsBy(index, sortBy),
					Limit = pagination?.Limit ?? 50,
					Offset = pagination?.Skip ?? 0,
				}
			);
		return new SearchPage<T>.SearchResult
		{
			Query = query,
			Items = await _libraryManager
				.Repository<T>()
				.FromIds(res.Hits.Select(x => x.Id).ToList(), include),
		};
	}

	/// <inheritdoc/>
	public Task<SearchPage<ILibraryItem>.SearchResult> SearchItems(
		string? query,
		Sort<ILibraryItem> sortBy,
		Filter<ILibraryItem>? filter,
		SearchPagination pagination,
		Include<ILibraryItem>? include = default
	)
	{
		return _Search(
			"items",
			query,
			filter.CreateMeilisearchFilter(),
			sortBy,
			pagination,
			include
		);
	}

	/// <inheritdoc/>
	public Task<SearchPage<Movie>.SearchResult> SearchMovies(
		string? query,
		Sort<Movie> sortBy,
		Filter<ILibraryItem>? filter,
		SearchPagination pagination,
		Include<Movie>? include = default
	)
	{
		return _Search(
			"items",
			query,
			_CreateMediaTypeFilter<Movie>(filter),
			sortBy,
			pagination,
			include
		);
	}

	/// <inheritdoc/>
	public Task<SearchPage<Show>.SearchResult> SearchShows(
		string? query,
		Sort<Show> sortBy,
		Filter<ILibraryItem>? filter,
		SearchPagination pagination,
		Include<Show>? include = default
	)
	{
		return _Search(
			"items",
			query,
			_CreateMediaTypeFilter<Show>(filter),
			sortBy,
			pagination,
			include
		);
	}

	/// <inheritdoc/>
	public Task<SearchPage<Collection>.SearchResult> SearchCollections(
		string? query,
		Sort<Collection> sortBy,
		Filter<ILibraryItem>? filter,
		SearchPagination pagination,
		Include<Collection>? include = default
	)
	{
		return _Search(
			"items",
			query,
			_CreateMediaTypeFilter<Collection>(filter),
			sortBy,
			pagination,
			include
		);
	}

	/// <inheritdoc/>
	public Task<SearchPage<Episode>.SearchResult> SearchEpisodes(
		string? query,
		Sort<Episode> sortBy,
		Filter<Episode>? filter,
		SearchPagination pagination,
		Include<Episode>? include = default
	)
	{
		return _Search(
			nameof(Episode),
			query,
			filter.CreateMeilisearchFilter(),
			sortBy,
			pagination,
			include
		);
	}

	/// <inheritdoc/>
	public Task<SearchPage<Studio>.SearchResult> SearchStudios(
		string? query,
		Sort<Studio> sortBy,
		Filter<Studio>? filter,
		SearchPagination pagination,
		Include<Studio>? include = default
	)
	{
		return _Search(
			nameof(Studio),
			query,
			filter.CreateMeilisearchFilter(),
			sortBy,
			pagination,
			include
		);
	}

	private string _CreateMediaTypeFilter<T>(Filter<ILibraryItem>? filter)
		where T : ILibraryItem
	{
		string filterString = $"kind = {typeof(T).Name}";
		if (filter is not null)
		{
			filterString += $" AND ({filter.CreateMeilisearchFilter()})";
		}
		return filterString;
	}

	private class IdResource
	{
		public Guid Id { get; set; }

		public string? Kind { get; set; }
	}
}
