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
		protected abstract Sort<T> DefaultSort { get; }

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
		/// Sort the given query.
		/// </summary>
		/// <param name="query">The query to sort.</param>
		/// <param name="sortBy">How to sort the query</param>
		/// <returns>The newly sorted query.</returns>
		protected IOrderedQueryable<T> Sort(IQueryable<T> query, Sort<T> sortBy = null)
		{
			sortBy ??= DefaultSort;

			IOrderedQueryable<T> _SortBy(IQueryable<T> qr, Expression<Func<T, object>> sort, bool desc, bool then)
			{
				if (then && qr is IOrderedQueryable<T> qro)
				{
					return desc
						? qro.ThenByDescending(sort)
						: qro.ThenBy(sort);
				}
				return desc
					? qr.OrderByDescending(sort)
					: qr.OrderBy(sort);
			}

			IOrderedQueryable<T> _Sort(IQueryable<T> query, Sort<T> sortBy, bool then)
			{
				switch (sortBy)
				{
					case Sort<T>.Default:
						return _Sort(query, DefaultSort, then);
					case Sort<T>.By(var key, var desc):
						return _SortBy(query, x => EF.Property<T>(x, key), desc, then);
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
			return _Sort(query, sortBy, false).ThenBy(x => x.ID);
		}

		private static Func<Expression, Expression, BinaryExpression> _GetComparisonExpression(
			bool desc,
			bool next,
			bool orEqual)
		{
			bool greaterThan = desc ^ next;

			return orEqual
				? (greaterThan ? Expression.GreaterThanOrEqual : Expression.LessThanOrEqual)
				: (greaterThan ? Expression.GreaterThan : Expression.LessThan);
		}

		/// <summary>
		/// Create a filter (where) expression on the query to skip everything before/after the referenceID.
		/// The generalized expression for this in pseudocode is:
		///   (x > a) OR
		///   (x = a AND y > b) OR
		///   (x = a AND y = b AND z > c) OR...
		///
		/// Of course, this will be a bit more complex when ASC and DESC are mixed.
		/// Assume x is ASC, y is DESC, and z is ASC:
		///   (x > a) OR
		///   (x = a AND y &lt; b) OR
		///   (x = a AND y = b AND z > c) OR...
		/// </summary>
		/// <param name="sort">How items are sorted in the query</param>
		/// <param name="reference">The reference item (the AfterID query)</param>
		/// <param name="next">True if the following page should be returned, false for the previous.</param>
		/// <returns>An expression ready to be added to a Where close of a sorted query to handle the AfterID</returns>
		protected Expression<Func<T, bool>> KeysetPaginatate(
			Sort<T> sort,
			T reference,
			bool next = true)
		{
			// x =>
			ParameterExpression x = Expression.Parameter(typeof(T), "x");
			ConstantExpression referenceC = Expression.Constant(reference, typeof(T));

			IEnumerable<Sort<T>.By> _GetSortsBy(Sort<T> sort)
			{
				return sort switch
				{
					Sort<T>.Default => _GetSortsBy(DefaultSort),
					Sort<T>.By @sortBy => new[] { sortBy },
					Sort<T>.Conglomerate(var list) => list.SelectMany(_GetSortsBy),
					_ => Array.Empty<Sort<T>.By>(),
				};
			}

			// Don't forget that every sorts must end with a ID sort (to differenciate equalities).
			Sort<T>.By id = new(x => x.ID);
			IEnumerable<Sort<T>.By> sorts = _GetSortsBy(sort).Append(id);

			BinaryExpression filter = null;
			List<Sort<T>.By> previousSteps = new();
			// TODO: Add an outer query >= for perf
			// PERF: See https://use-the-index-luke.com/sql/partial-results/fetch-next-page#sb-equivalent-logic
			foreach ((string key, bool desc) in sorts)
			{
				BinaryExpression compare = null;

				// Create all the equality statements for previous sorts.
				foreach ((string pKey, bool pDesc) in previousSteps)
				{
					BinaryExpression pcompare = Expression.Equal(
						Expression.Property(x, pKey),
						Expression.Property(referenceC, pKey)
					);
					compare = compare != null
						? Expression.AndAlso(compare, pcompare)
						: pcompare;
				}

				// Create the last comparison of the statement.
				Func<Expression, Expression, BinaryExpression> comparer = _GetComparisonExpression(desc, next, false);
				MemberExpression xkey = Expression.Property(x, key);
				MemberExpression rkey = Expression.Property(referenceC, key);
				BinaryExpression lastCompare = ApiHelper.StringCompatibleExpression(comparer, xkey, rkey);
				compare = compare != null
					? Expression.AndAlso(compare, lastCompare)
					: lastCompare;

				filter = filter != null
					? Expression.OrElse(filter, compare)
					: compare;

				previousSteps.Add(new(key, desc));
			}
			return Expression.Lambda<Func<T, bool>>(filter, x);
		}

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
			return Sort(Database.Set<T>(), sortBy).FirstOrDefaultAsync(where);
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
		protected async Task<ICollection<T>> ApplyFilters(IQueryable<T> query,
			Expression<Func<T, bool>> where = null,
			Sort<T> sort = default,
			Pagination limit = default)
		{
			query = Sort(query, sort);
			if (where != null)
				query = query.Where(where);

			if (limit.AfterID != null)
			{
				T reference = await Get(limit.AfterID.Value);
				query = query.Where(KeysetPaginatate(sort, reference, !limit.Reverse));
			}
			if (limit.Limit > 0)
				query = query.Take(limit.Limit);

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
