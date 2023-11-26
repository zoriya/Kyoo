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
using System.Data.Common;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Exceptions;
using Kyoo.Abstractions.Models.Utils;

namespace Kyoo.Core.Controllers;

public abstract class DapperRepository<T> : IRepository<T>
	where T : class, IResource, IQuery
{
	public Type RepositoryType => typeof(T);

	protected abstract FormattableString Sql { get; }

	protected abstract Dictionary<string, Type> Config { get; }

	protected abstract T Mapper(List<object?> items);

	protected DbConnection Database { get; init; }

	public DapperRepository(DbConnection database)
	{
		Database = database;
	}

	/// <inheritdoc/>
	public virtual async Task<T> Get(int id, Include<T>? include = default)
	{
		T? ret = await GetOrDefault(id, include);
		if (ret == null)
			throw new ItemNotFoundException($"No {typeof(T).Name} found with the id {id}");
		return ret;
	}

	/// <inheritdoc/>
	public virtual async Task<T> Get(string slug, Include<T>? include = default)
	{
		T? ret = await GetOrDefault(slug, include);
		if (ret == null)
			throw new ItemNotFoundException($"No {typeof(T).Name} found with the slug {slug}");
		return ret;
	}

	/// <inheritdoc/>
	public virtual async Task<T> Get(Filter<T> filter,
		Include<T>? include = default)
	{
		T? ret = await GetOrDefault(filter, include: include);
		if (ret == null)
			throw new ItemNotFoundException($"No {typeof(T).Name} found with the given predicate.");
		return ret;
	}

	/// <inheritdoc />
	public Task<ICollection<T>> FromIds(IList<int> ids, Include<T>? include = null)
	{
		throw new NotImplementedException();
	}

	/// <inheritdoc />
	public Task<T?> GetOrDefault(int id, Include<T>? include = null)
	{
		return Database.QuerySingle<T>(
			Sql,
			Config,
			Mapper,
			include,
			new Filter<T>.Eq(nameof(IResource.Id), id)
		);
	}

	/// <inheritdoc />
	public Task<T?> GetOrDefault(string slug, Include<T>? include = null)
	{
		return Database.QuerySingle<T>(
			Sql,
			Config,
			Mapper,
			include,
			new Filter<T>.Eq(nameof(IResource.Slug), slug)
		);
	}

	/// <inheritdoc />
	public Task<T?> GetOrDefault(Filter<T>? filter, Include<T>? include = null, Sort<T>? sortBy = null)
	{
		return Database.QuerySingle<T>(
			Sql,
			Config,
			Mapper,
			include,
			filter,
			sortBy
		);
	}

	/// <inheritdoc />
	public Task<ICollection<T>> GetAll(Filter<T>? filter = default,
		Sort<T>? sort = default,
		Include<T>? include = default,
		Pagination? limit = default)
	{
		return Database.Query<T>(
			Sql,
			Config,
			Mapper,
			(id) => Get(id),
			include,
			filter,
			sort ?? new Sort<T>.Default(),
			limit ?? new()
		);
	}

	/// <inheritdoc />
	public Task<int> GetCount(Filter<T>? filter = null)
	{
		return Database.Count(
			Sql,
			Config,
			filter
		);
	}

	/// <inheritdoc />
	public Task<ICollection<T>> Search(string query, Include<T>? include = null) => throw new NotImplementedException();

	/// <inheritdoc />
	public Task<T> Create(T obj) => throw new NotImplementedException();

	/// <inheritdoc />
	public Task<T> CreateIfNotExists(T obj) => throw new NotImplementedException();

	/// <inheritdoc />
	public Task Delete(int id) => throw new NotImplementedException();

	/// <inheritdoc />
	public Task Delete(string slug) => throw new NotImplementedException();

	/// <inheritdoc />
	public Task Delete(T obj) => throw new NotImplementedException();

	/// <inheritdoc />
	public Task DeleteAll(Filter<T> filter) => throw new NotImplementedException();

	/// <inheritdoc />
	public Task<T> Edit(T edited) => throw new NotImplementedException();

	/// <inheritdoc />
	public Task<T> Patch(int id, Func<T, Task<bool>> patch) => throw new NotImplementedException();
}
