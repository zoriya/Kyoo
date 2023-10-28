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

using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Utils;
using Meilisearch;

namespace Kyoo.Meiliseach;

public class SearchManager
{
	private readonly MeilisearchClient _client;
	private readonly ILibraryManager _libraryManager;

	public SearchManager(MeilisearchClient client, ILibraryManager libraryManager)
	{
		_client = client;
		_libraryManager = libraryManager;

		_libraryManager.Movies.OnCreated += (x) => _CreateOrUpdate("items", x);
		_libraryManager.Movies.OnEdited += (x) => _CreateOrUpdate("items", x);
		_libraryManager.Movies.OnDeleted += (x) => _Delete("items", x.Id);
	}

	private Task _CreateOrUpdate(string index, IResource item)
	{
		return _client.Index(index).AddDocumentsAsync(new[] { item });
	}

	private Task _Delete(string index, int id)
	{
		return _client.Index(index).DeleteOneDocumentAsync(id);
	}

	private async Task<ICollection<T>> _Search<T>(string index, string? query, Include<T>? include = default)
	{
		ISearchable<IResource> res = await _client.Index(index).SearchAsync<IResource>(query, new SearchQuery()
		{
		});
		throw new NotImplementedException();
	}
}
