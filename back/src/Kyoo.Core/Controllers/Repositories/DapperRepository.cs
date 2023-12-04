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
using System.Linq;
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

	protected SqlVariableContext Context { get; init; }


	public DapperRepository(DbConnection database, SqlVariableContext context)
	{
		Database = database;
		Context = context;
	}

	/// <inheritdoc/>
	public virtual async Task<T> Get(Guid id, Include<T>? include = default)
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
	public virtual async Task<T> Get(Filter<T>? filter,
		Include<T>? include = default,
		Sort<T>? sortBy = default,
		bool reverse = false,
		Guid? afterId = default)
	{
		T? ret = await GetOrDefault(filter, include, sortBy, reverse, afterId);
		if (ret == null)
			throw new ItemNotFoundException($"No {typeof(T).Name} found with the given predicate.");
		return ret;
	}

	/// <inheritdoc />
	public async Task<ICollection<T>> FromIds(IList<Guid> ids, Include<T>? include = null)
	{
		return (await Database.Query<T>(
				Sql,
				Config,
				Mapper,
				(id) => Get(id),
				Context,
				include,
				Filter.Or(ids.Select(x => new Filter<T>.Eq("id", x)).ToArray()),
				sort: null,
				limit: null
			))
			.OrderBy(x => ids.IndexOf(x.Id))
			.ToList();
	}

	/// <inheritdoc />
	public Task<T?> GetOrDefault(Guid id, Include<T>? include = null)
	{
		return Database.QuerySingle<T>(
			Sql,
			Config,
			Mapper,
			Context,
			include,
			new Filter<T>.Eq(nameof(IResource.Id), id)
		);
	}

	/// <inheritdoc />
	public Task<T?> GetOrDefault(string slug, Include<T>? include = null)
	{
		if (slug == "random")
		{
			return Database.QuerySingle<T>(
				Sql,
				Config,
				Mapper,
				Context,
				include,
				filter: null,
				new Sort<T>.Random()
			);
		}
		return Database.QuerySingle<T>(
			Sql,
			Config,
			Mapper,
			Context,
			include,
			new Filter<T>.Eq(nameof(IResource.Slug), slug)
		);
	}

	/// <inheritdoc />
	public virtual Task<T?> GetOrDefault(Filter<T>? filter,
		Include<T>? include = default,
		Sort<T>? sortBy = default,
		bool reverse = false,
		Guid? afterId = default)
	{
		return Database.QuerySingle<T>(
			Sql,
			Config,
			Mapper,
			Context,
			include,
			filter,
			sortBy,
			reverse,
			afterId
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
			Context,
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
			Context,
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
	public Task Delete(Guid id) => throw new NotImplementedException();

	/// <inheritdoc />
	public Task Delete(string slug) => throw new NotImplementedException();

	/// <inheritdoc />
	public Task Delete(T obj) => throw new NotImplementedException();

	/// <inheritdoc />
	public Task DeleteAll(Filter<T> filter) => throw new NotImplementedException();

	/// <inheritdoc />
	public Task<T> Edit(T edited) => throw new NotImplementedException();

	/// <inheritdoc />
	public Task<T> Patch(Guid id, Func<T, Task<bool>> patch) => throw new NotImplementedException();
}
