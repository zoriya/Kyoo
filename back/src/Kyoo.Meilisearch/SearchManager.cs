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
using System.Dynamic;
using System.Reflection;
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
	{
		return sort switch
		{
			Sort<T>.Default => Array.Empty<string>(),
			Sort<T>.By @sortBy => MeilisearchModule.IndexSettings[index].SortableAttributes.Contains(sortBy.Key, StringComparer.InvariantCultureIgnoreCase)
				? new[] { $"{CamelCase.ConvertName(sortBy.Key)}:{(sortBy.Desendant ? "desc" : "asc")}" }
				: throw new ValidationException($"Invalid sorting mode: {sortBy.Key}"),
			Sort<T>.Conglomerate(var list) => list.SelectMany(x => _GetSortsBy(index, x)),
			Sort<T>.Random => throw new ValidationException("Random sorting is not supported while searching."),
			_ => Array.Empty<string>(),
		};
	}

	public SearchManager(MeilisearchClient client, ILibraryManager libraryManager)
	{
		_client = client;
		_libraryManager = libraryManager;

		IRepository<Movie>.OnCreated += (x) => CreateOrUpdate("items", x, nameof(Movie));
		IRepository<Movie>.OnEdited += (x) => CreateOrUpdate("items", x, nameof(Movie));
		IRepository<Movie>.OnDeleted += (x) => _Delete("items", x.Id, nameof(Movie));
		IRepository<Show>.OnCreated += (x) => CreateOrUpdate("items", x, nameof(Show));
		IRepository<Show>.OnEdited += (x) => CreateOrUpdate("items", x, nameof(Show));
		IRepository<Show>.OnDeleted += (x) => _Delete("items", x.Id, nameof(Show));
		IRepository<Collection>.OnCreated += (x) => CreateOrUpdate("items", x, nameof(Collection));
		IRepository<Collection>.OnEdited += (x) => CreateOrUpdate("items", x, nameof(Collection));
		IRepository<Collection>.OnDeleted += (x) => _Delete("items", x.Id, nameof(Collection));

		IRepository<Episode>.OnCreated += (x) => CreateOrUpdate(nameof(Episode), x);
		IRepository<Episode>.OnEdited += (x) => CreateOrUpdate(nameof(Episode), x);
		IRepository<Episode>.OnDeleted += (x) => _Delete(nameof(Episode), x.Id);

		IRepository<Studio>.OnCreated += (x) => CreateOrUpdate(nameof(Studio), x);
		IRepository<Studio>.OnEdited += (x) => CreateOrUpdate(nameof(Studio), x);
		IRepository<Studio>.OnDeleted += (x) => _Delete(nameof(Studio), x.Id);
	}

	public Task CreateOrUpdate(string index, IResource item, string? kind = null)
	{
		if (kind != null)
		{
			dynamic expando = new ExpandoObject();
			var dictionary = (IDictionary<string, object?>)expando;

			foreach (PropertyInfo property in item.GetType().GetProperties())
				dictionary.Add(CamelCase.ConvertName(property.Name), property.GetValue(item));
			dictionary.Add("ref", $"{kind}-{item.Id}");
			expando.kind = kind;
			return _client.Index(index).AddDocumentsAsync(new[] { expando });
		}
		return _client.Index(index).AddDocumentsAsync(new[] { item });
	}

	private Task _Delete(string index, int id, string? kind = null)
	{
		if (kind != null)
		{
			return _client.Index(index).DeleteOneDocumentAsync($"{kind}/{id}");
		}
		return _client.Index(index).DeleteOneDocumentAsync(id);
	}

	private async Task<SearchPage<T>.SearchResult> _Search<T>(string index, string? query,
		string? where = null,
		Sort<T>? sortBy = default,
		SearchPagination? pagination = default,
		Include<T>? include = default)
		where T : class, IResource
	{
		// TODO: add filters and facets
		ISearchable<IdResource> res = await _client.Index(index).SearchAsync<IdResource>(query, new SearchQuery()
		{
			Filter = where,
			Sort = _GetSortsBy(index, sortBy),
			Limit = pagination?.Limit ?? 50,
			Offset = pagination?.Skip ?? 0,
		});
		return new SearchPage<T>.SearchResult
		{
			Query = query,
			Items = await _libraryManager.Repository<T>()
				.FromIds(res.Hits.Select(x => x.Id).ToList(), include),
		};
	}

	public async Task<SearchPage<LibraryItem>.SearchResult> SearchItems(string? query,
		Sort<LibraryItem> sortBy,
		SearchPagination pagination,
		Include<LibraryItem>? include = default)
	{
		// TODO: add filters and facets
		ISearchable<IdResource> res = await _client.Index("items").SearchAsync<IdResource>(query, new SearchQuery()
		{
			Sort = _GetSortsBy("items", sortBy),
			Limit = pagination?.Limit ?? 50,
			Offset = pagination?.Skip ?? 0,
		});

		// Since library items's ID are still ints mapped from real items ids, we must map it here to match the db's value.
		// Look at the items Migration's sql to understand where magic numbers come from.
		List<int> ids = res.Hits.Select(x => x.Kind switch
		{
			nameof(Show) => x.Id,
			nameof(Movie) => -x.Id,
			nameof(Collection) => x.Id + 10_000,
			_ => throw new InvalidOperationException("An unknown item kind was found in meilisearch"),
		}).ToList();

		return new SearchPage<LibraryItem>.SearchResult
		{
			Query = query,
			Items = await _libraryManager.LibraryItems
				.FromIds(ids, include),
		};
	}

	/// <inheritdoc/>
	public Task<SearchPage<Movie>.SearchResult> SearchMovies(string? query,
		Sort<Movie> sortBy,
		SearchPagination pagination,
		Include<Movie>? include = default)
	{
		return _Search("items", query, $"kind = {nameof(Movie)}", sortBy, pagination, include);
	}

	/// <inheritdoc/>
	public Task<SearchPage<Show>.SearchResult> SearchShows(string? query,
		Sort<Show> sortBy,
		SearchPagination pagination,
		Include<Show>? include = default)
	{
		return _Search("items", query, $"kind = {nameof(Show)}", sortBy, pagination, include);
	}

	/// <inheritdoc/>
	public Task<SearchPage<Collection>.SearchResult> SearchCollections(string? query,
		Sort<Collection> sortBy,
		SearchPagination pagination,
		Include<Collection>? include = default)
	{
		return _Search("items", query, $"kind = {nameof(Collection)}", sortBy, pagination, include);
	}

	/// <inheritdoc/>
	public Task<SearchPage<Episode>.SearchResult> SearchEpisodes(string? query,
		Sort<Episode> sortBy,
		SearchPagination pagination,
		Include<Episode>? include = default)
	{
		return _Search(nameof(Episode), query, null, sortBy, pagination, include);
	}

	/// <inheritdoc/>
	public Task<SearchPage<Studio>.SearchResult> SearchStudios(string? query,
		Sort<Studio> sortBy,
		SearchPagination pagination,
		Include<Studio>? include = default)
	{
		return _Search(nameof(Studio), query, null, sortBy, pagination, include);
	}

	private class IdResource
	{
		public int Id { get; set; }

		public string? Kind { get; set; }
	}
}
