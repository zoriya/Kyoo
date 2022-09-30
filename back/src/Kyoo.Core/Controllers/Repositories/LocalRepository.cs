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
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Abstractions.Models.Exceptions;
using Kyoo.Core.Api;
using Kyoo.Utils;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Core.Controllers
{
	/// <summary>
	/// A base class to create repositories using Entity Framework.
	/// </summary>
	/// <typeparam name="T">The type of this repository</typeparam>
	public abstract class LocalRepository<T> : IRepository<T>
		where T : class, IResource
	{
		/// <summary>
		/// The Entity Framework's Database handle.
		/// </summary>
		protected DbContext Database { get; }

		/// <summary>
		/// The default sort order that will be used for this resource's type.
		/// </summary>
		protected abstract Expression<Func<T, object>> DefaultSort { get; }

		/// <summary>
		/// Create a new base <see cref="LocalRepository{T}"/> with the given database handle.
		/// </summary>
		/// <param name="database">A database connection to load resources of type <typeparamref name="T"/></param>
		protected LocalRepository(DbContext database)
		{
			Database = database;
		}

		/// <inheritdoc/>
		public Type RepositoryType => typeof(T);

		/// <summary>
		/// Get a resource from it's ID and make the <see cref="Database"/> instance track it.
		/// </summary>
		/// <param name="id">The ID of the resource</param>
		/// <exception cref="ItemNotFoundException">If the item is not found</exception>
		/// <returns>The tracked resource with the given ID</returns>
		protected virtual async Task<T> GetWithTracking(int id)
		{
			T ret = await Database.Set<T>().AsTracking().FirstOrDefaultAsync(x => x.ID == id);
			if (ret == null)
				throw new ItemNotFoundException($"No {typeof(T).Name} found with the id {id}");
			return ret;
		}

		/// <inheritdoc/>
		public virtual async Task<T> Get(int id)
		{
			T ret = await GetOrDefault(id);
			if (ret == null)
				throw new ItemNotFoundException($"No {typeof(T).Name} found with the id {id}");
			return ret;
		}

		/// <inheritdoc/>
		public virtual async Task<T> Get(string slug)
		{
			T ret = await GetOrDefault(slug);
			if (ret == null)
				throw new ItemNotFoundException($"No {typeof(T).Name} found with the slug {slug}");
			return ret;
		}

		/// <inheritdoc/>
		public virtual async Task<T> Get(Expression<Func<T, bool>> where)
		{
			T ret = await GetOrDefault(where);
			if (ret == null)
				throw new ItemNotFoundException($"No {typeof(T).Name} found with the given predicate.");
			return ret;
		}

		/// <inheritdoc />
		public virtual Task<T> GetOrDefault(int id)
		{
			return Database.Set<T>().FirstOrDefaultAsync(x => x.ID == id);
		}

		/// <inheritdoc />
		public virtual Task<T> GetOrDefault(string slug)
		{
			return Database.Set<T>().FirstOrDefaultAsync(x => x.Slug == slug);
		}

		/// <inheritdoc />
		public virtual Task<T> GetOrDefault(Expression<Func<T, bool>> where, Sort<T> sortBy = default)
		{
			IQueryable<T> query = Database.Set<T>();
			Expression<Func<T, object>> sortKey = sortBy.Key ?? DefaultSort;
			query = sortBy.Descendant ? query.OrderByDescending(sortKey) : query.OrderBy(sortKey);
			return query.FirstOrDefaultAsync(where);
		}

		/// <inheritdoc/>
		public abstract Task<ICollection<T>> Search(string query);

		/// <inheritdoc/>
		public virtual Task<ICollection<T>> GetAll(Expression<Func<T, bool>> where = null,
			Sort<T> sort = default,
			Pagination limit = default)
		{
			return ApplyFilters(Database.Set<T>(), where, sort, limit);
		}

		/// <summary>
		/// Apply filters to a query to ease sort, pagination and where queries for resources of this repository
		/// </summary>
		/// <param name="query">The base query to filter.</param>
		/// <param name="where">An expression to filter based on arbitrary conditions</param>
		/// <param name="sort">The sort settings (sort order and sort by)</param>
		/// <param name="limit">Pagination information (where to start and how many to get)</param>
		/// <returns>The filtered query</returns>
		protected Task<ICollection<T>> ApplyFilters(IQueryable<T> query,
			Expression<Func<T, bool>> where = null,
			Sort<T> sort = default,
			Pagination limit = default)
		{
			return ApplyFilters(query, GetOrDefault, DefaultSort, where, sort, limit);
		}

		/// <summary>
		/// Apply filters to a query to ease sort, pagination and where queries for any resources types.
		/// For resources of type <typeparamref name="T"/>, see <see cref="ApplyFilters"/>
		/// </summary>
		/// <param name="query">The base query to filter.</param>
		/// <param name="get">A function to asynchronously get a resource from the database using it's ID.</param>
		/// <param name="defaultSort">The default sort order of this resource's type.</param>
		/// <param name="where">An expression to filter based on arbitrary conditions</param>
		/// <param name="sort">The sort settings (sort order and sort by)</param>
		/// <param name="limit">Pagination information (where to start and how many to get)</param>
		/// <typeparam name="TValue">The type of items to query.</typeparam>
		/// <returns>The filtered query</returns>
		protected async Task<ICollection<TValue>> ApplyFilters<TValue>(IQueryable<TValue> query,
			Func<int, Task<TValue>> get,
			Expression<Func<TValue, object>> defaultSort,
			Expression<Func<TValue, bool>> where = null,
			Sort<TValue> sort = default,
			Pagination limit = default)
		{
			if (where != null)
				query = query.Where(where);

			Expression<Func<TValue, object>> sortKey = sort.Key ?? defaultSort;
			Expression sortExpression = sortKey.Body.NodeType == ExpressionType.Convert
				? ((UnaryExpression)sortKey.Body).Operand
				: sortKey.Body;

			if (typeof(Enum).IsAssignableFrom(sortExpression.Type))
				throw new ArgumentException("Invalid sort key.");

			query = sort.Descendant ? query.OrderByDescending(sortKey) : query.OrderBy(sortKey);

			if (limit.AfterID != null)
			{
				TValue after = await get(limit.AfterID.Value);
				Expression key = Expression.Constant(sortKey.Compile()(after), sortExpression.Type);
				query = query.Where(Expression.Lambda<Func<TValue, bool>>(
					ApiHelper.StringCompatibleExpression(Expression.GreaterThan, sortExpression, key),
					sortKey.Parameters.First()
				));
			}
			if (limit.Count > 0)
				query = query.Take(limit.Count);

			return await query.ToListAsync();
		}

		/// <inheritdoc/>
		public virtual Task<int> GetCount(Expression<Func<T, bool>> where = null)
		{
			IQueryable<T> query = Database.Set<T>();
			if (where != null)
				query = query.Where(where);
			return query.CountAsync();
		}

		/// <inheritdoc/>
		public virtual async Task<T> Create(T obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			await Validate(obj);
			return obj;
		}

		/// <inheritdoc/>
		public virtual async Task<T> CreateIfNotExists(T obj)
		{
			try
			{
				if (obj == null)
					throw new ArgumentNullException(nameof(obj));

				T old = await GetOrDefault(obj.Slug);
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
		public virtual async Task<T> Edit(T edited, bool resetOld)
		{
			if (edited == null)
				throw new ArgumentNullException(nameof(edited));

			bool lazyLoading = Database.ChangeTracker.LazyLoadingEnabled;
			Database.ChangeTracker.LazyLoadingEnabled = false;
			try
			{
				T old = await GetWithTracking(edited.ID);

				if (resetOld)
					old = Merger.Nullify(old);
				Merger.Complete(old, edited, x => x.GetCustomAttribute<LoadableRelationAttribute>() == null);
				await EditRelations(old, edited, resetOld);
				await Database.SaveChangesAsync();
				return old;
			}
			finally
			{
				Database.ChangeTracker.LazyLoadingEnabled = lazyLoading;
				Database.ChangeTracker.Clear();
			}
		}

		/// <summary>
		/// An overridable method to edit relation of a resource.
		/// </summary>
		/// <param name="resource">
		/// The non edited resource
		/// </param>
		/// <param name="changed">
		/// The new version of <paramref name="resource"/>.
		/// This item will be saved on the database and replace <paramref name="resource"/>
		/// </param>
		/// <param name="resetOld">
		/// A boolean to indicate if all values of resource should be discarded or not.
		/// </param>
		/// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
		protected virtual Task EditRelations(T resource, T changed, bool resetOld)
		{
			return Validate(resource);
		}

		/// <summary>
		/// A method called just before saving a new resource to the database.
		/// It is also called on the default implementation of <see cref="EditRelations"/>
		/// </summary>
		/// <param name="resource">The resource that will be saved</param>
		/// <exception cref="ArgumentException">
		/// You can throw this if the resource is illegal and should not be saved.
		/// </exception>
		/// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
		protected virtual Task Validate(T resource)
		{
			if (typeof(T).GetProperty(nameof(resource.Slug))!.GetCustomAttribute<ComputedAttribute>() != null)
				return Task.CompletedTask;
			if (string.IsNullOrEmpty(resource.Slug))
				throw new ArgumentException("Resource can't have null as a slug.");
			if (int.TryParse(resource.Slug, out int _))
			{
				try
				{
					MethodInfo setter = typeof(T).GetProperty(nameof(resource.Slug))!.GetSetMethod();
					if (setter != null)
						setter.Invoke(resource, new object[] { resource.Slug + '!' });
					else
						throw new ArgumentException("Resources slug can't be number only.");
				}
				catch
				{
					throw new ArgumentException("Resources slug can't be number only.");
				}
			}
			return Task.CompletedTask;
		}

		/// <inheritdoc/>
		public virtual async Task Delete(int id)
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
		public abstract Task Delete(T obj);

		/// <inheritdoc/>
		public async Task DeleteAll(Expression<Func<T, bool>> where)
		{
			foreach (T resource in await GetAll(where))
				await Delete(resource);
		}
	}
}
