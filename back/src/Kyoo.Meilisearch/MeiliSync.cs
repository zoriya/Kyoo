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

using System.Dynamic;
using System.Reflection;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Meilisearch;
using static System.Text.Json.JsonNamingPolicy;

namespace Kyoo.Meiliseach;

public class MeiliSync
{
	private readonly MeilisearchClient _client;

	public MeiliSync(MeilisearchClient client)
	{
		_client = client;

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
}
