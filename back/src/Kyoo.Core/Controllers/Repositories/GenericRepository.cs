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
using System.Linq.Expressions;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Abstractions.Models.Exceptions;
using Kyoo.Abstractions.Models.Utils;
using Kyoo.Postgresql;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Core.Controllers;

public abstract class GenericRepository<T>(DatabaseContext database) : IRepository<T>
	where T : class, IResource, IQuery
{
	public DatabaseContext Database => database;

	/// <inheritdoc/>
	public Type RepositoryType => typeof(T);

	/// <summary>
	/// Sort the given query.
	/// </summary>
	/// <param name="query">The query to sort.</param>
	/// <param name="sortBy">How to sort the query.</param>
	/// <returns>The newly sorted query.</returns>
	protected IOrderedQueryable<T> Sort(IQueryable<T> query, Sort<T>? sortBy)
	{
		sortBy ??= new Sort<T>.Default();

		IOrderedQueryable<T> _SortBy(
			IQueryable<T> qr,
			Expression<Func<T, object>> sort,
			bool desc,
			bool then
		)
		{
			if (then && qr is IOrderedQueryable<T> qro)
			{
				return desc ? qro.ThenByDescending(sort) : qro.ThenBy(sort);
			}
			return desc ? qr.OrderByDescending(sort) : qr.OrderBy(sort);
		}

		IOrderedQueryable<T> _Sort(IQueryable<T> query, Sort<T> sortBy, bool then)
		{
			switch (sortBy)
			{
				case Sort<T>.Default(var value):
					return _Sort(query, value, then);
				case Sort<T>.By(var key, var desc):
					return _SortBy(query, x => EF.Property<T>(x, key), desc, then);
				case Sort<T>.Random(var seed):
					// NOTE: To edit this, don't forget to edit the random handiling inside the KeysetPaginate function
					return _SortBy(
						query,
						x => DatabaseContext.MD5(seed + x.Id.ToString()),
						false,
						then
					);
				case Sort<T>.Conglomerate(var sorts):
					IOrderedQueryable<T> nQuery = _Sort(query, sorts.First(), false);
					foreach (Sort<T> sort in sorts.Skip(1))
						nQuery = _Sort(nQuery, sort, true);
					return nQuery;
				default:
					// The language should not require me to do this...
					throw new SwitchExpressionException();
			}
		}
		return _Sort(query, sortBy, false).ThenBy(x => x.Id);
	}

	protected IQueryable<T> AddIncludes(IQueryable<T> query, Include<T>? include)
	{
		if (include == null)
			return query;
		foreach (string field in include.Fields)
			query = query.Include(field);
		return query;
	}

	protected virtual async Task<T> GetWithTracking(Guid id)
	{
		T? ret = await Database.Set<T>().AsTracking().FirstOrDefaultAsync(x => x.Id == id);
		if (ret == null)
			throw new ItemNotFoundException($"No {typeof(T).Name} found with the id {id}");
		return ret;
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
	public virtual async Task<T> Get(
		Filter<T> filter,
		Include<T>? include = default,
		Sort<T>? sortBy = default,
		bool reverse = false,
		Guid? afterId = default
	)
	{
		T? ret = await GetOrDefault(filter, include, sortBy, reverse, afterId);
		if (ret == null)
			throw new ItemNotFoundException($"No {typeof(T).Name} found with the given predicate.");
		return ret;
	}

	/// <inheritdoc />
	public virtual Task<T?> GetOrDefault(Guid id, Include<T>? include = default)
	{
		return AddIncludes(Database.Set<T>(), include).FirstOrDefaultAsync(x => x.Id == id);
	}

	/// <inheritdoc />
	public virtual Task<T?> GetOrDefault(string slug, Include<T>? include = default)
	{
		if (slug == "random")
		{
			return AddIncludes(Database.Set<T>(), include)
				.OrderBy(x => EF.Functions.Random())
				.FirstOrDefaultAsync();
		}
		return AddIncludes(Database.Set<T>(), include).FirstOrDefaultAsync(x => x.Slug == slug);
	}

	/// <inheritdoc />
	public virtual async Task<T?> GetOrDefault(
		Filter<T>? filter,
		Include<T>? include = default,
		Sort<T>? sortBy = default,
		bool reverse = false,
		Guid? afterId = default
	)
	{
		IQueryable<T> query = await ApplyFilters(
			Database.Set<T>(),
			filter,
			sortBy,
			new Pagination(1, afterId, reverse),
			include
		);
		return await query.FirstOrDefaultAsync();
	}

	/// <inheritdoc/>
	public virtual async Task<ICollection<T>> FromIds(
		IList<Guid> ids,
		Include<T>? include = default
	)
	{
		return (
			await AddIncludes(Database.Set<T>(), include)
				.Where(x => ids.Contains(x.Id))
				.ToListAsync()
		)
			.OrderBy(x => ids.IndexOf(x.Id))
			.ToList();
	}

	/// <inheritdoc/>
	public abstract Task<ICollection<T>> Search(string query, Include<T>? include = default);

	/// <inheritdoc/>
	public virtual async Task<ICollection<T>> GetAll(
		Filter<T>? filter = null,
		Sort<T>? sort = default,
		Include<T>? include = default,
		Pagination? limit = default
	)
	{
		IQueryable<T> query = await ApplyFilters(Database.Set<T>(), filter, sort, limit, include);
		return await query.ToListAsync();
	}

	/// <summary>
	/// Apply filters to a query to ease sort, pagination and where queries for resources of this repository
	/// </summary>
	/// <param name="query">The base query to filter.</param>
	/// <param name="filter">An expression to filter based on arbitrary conditions</param>
	/// <param name="sort">The sort settings (sort order and sort by)</param>
	/// <param name="limit">Pagination information (where to start and how many to get)</param>
	/// <param name="include">Related fields to also load with this query.</param>
	/// <returns>The filtered query</returns>
	protected async Task<IQueryable<T>> ApplyFilters(
		IQueryable<T> query,
		Filter<T>? filter = null,
		Sort<T>? sort = default,
		Pagination? limit = default,
		Include<T>? include = default
	)
	{
		query = AddIncludes(query, include);
		query = Sort(query, sort);
		limit ??= new();

		if (limit.AfterID != null)
		{
			T reference = await Get(limit.AfterID.Value);
			Filter<T>? keysetFilter = RepositoryHelper.KeysetPaginate(
				sort,
				reference,
				!limit.Reverse
			);
			filter = Filter.And(filter, keysetFilter);
		}
		if (filter != null)
			query = query.Where(filter.ToEfLambda());

		if (limit.Reverse)
			query = query.Reverse();
		if (limit.Limit > 0)
			query = query.Take(limit.Limit);
		if (limit.Reverse)
			query = query.Reverse();

		return query;
	}

	/// <inheritdoc/>
	public virtual Task<int> GetCount(Filter<T>? filter = null)
	{
		IQueryable<T> query = Database.Set<T>();
		if (filter != null)
			query = query.Where(filter.ToEfLambda());
		return query.CountAsync();
	}

	/// <inheritdoc/>
	public virtual async Task<T> Create(T obj)
	{
		await Validate(obj);
		Database.Entry(obj).State = EntityState.Added;
		await Database.SaveChangesAsync(() => Get(obj.Slug));
		await IRepository<T>.OnResourceCreated(obj);
		return obj;
	}

	/// <inheritdoc/>
	public virtual async Task<T> CreateIfNotExists(T obj)
	{
		try
		{
			T? old = await GetOrDefault(obj.Slug);
			if (old != null)
				return old;

			return await Create(obj);
		}
		catch (DuplicatedItemException)
		{
			return await Get(obj.Slug);
		}
	}

	/// <inheritdoc/>
	public virtual async Task<T> Edit(T edited)
	{
		await Validate(edited);
		Database.Entry(edited).State = EntityState.Modified;
		await Database.SaveChangesAsync();
		await IRepository<T>.OnResourceEdited(edited);
		return edited;
	}

	/// <inheritdoc/>
	public virtual async Task<T> Patch(Guid id, Func<T, T> patch)
	{
		bool lazyLoading = Database.ChangeTracker.LazyLoadingEnabled;
		Database.ChangeTracker.LazyLoadingEnabled = false;
		try
		{
			T resource = await GetWithTracking(id);

			resource = patch(resource);

			await Database.SaveChangesAsync();
			await IRepository<T>.OnResourceEdited(resource);
			return resource;
		}
		finally
		{
			Database.ChangeTracker.LazyLoadingEnabled = lazyLoading;
			Database.ChangeTracker.Clear();
		}
	}

	/// <exception cref="ArgumentException">
	/// You can throw this if the resource is illegal and should not be saved.
	/// </exception>
	protected virtual Task Validate(T resource)
	{
		if (
			typeof(T).GetProperty(nameof(resource.Slug))!.GetCustomAttribute<ComputedAttribute>()
			!= null
		)
			return Task.CompletedTask;
		if (string.IsNullOrEmpty(resource.Slug))
			throw new ArgumentException("Resource can't have null as a slug.");
		if (resource.Slug == "random")
			throw new ArgumentException("Resources slug can't be the literal \"random\".");
		return Task.CompletedTask;
	}

	/// <inheritdoc/>
	public virtual async Task Delete(Guid id)
	{
		T resource = await Get(id);
		await Delete(resource);
	}

	/// <inheritdoc/>
	public virtual async Task Delete(string slug)
	{
		T resource = await Get(slug);
		await Delete(resource);
	}

	/// <inheritdoc/>
	public virtual async Task Delete(T obj)
	{
		await Database.Set<T>().Where(x => x.Id == obj.Id).ExecuteDeleteAsync();
		await IRepository<T>.OnResourceDeleted(obj);
	}

	/// <inheritdoc/>
	public virtual async Task DeleteAll(Filter<T> filter)
	{
		ICollection<T> items = await GetAll(filter);
		Guid[] ids = items.Select(x => x.Id).ToArray();
		await Database.Set<T>().Where(x => ids.Contains(x.Id)).ExecuteDeleteAsync();

		foreach (T resource in items)
			await IRepository<T>.OnResourceDeleted(resource);
	}
}
