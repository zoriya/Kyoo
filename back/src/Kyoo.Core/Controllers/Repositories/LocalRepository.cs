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

			switch (sortBy)
			{
				case Sort<T>.Default:
					return Sort(query, DefaultSort);
				case Sort<T>.By(var key, var desc):
					return desc
						? query.OrderByDescending(x => EF.Property<object>(x, key))
						: query.OrderBy(x => EF.Property<T>(x, key));
				case Sort<T>.Conglomerate(var keys):
					IOrderedQueryable<T> nQuery = Sort(query, keys[0]);
					foreach ((string key, bool desc) in keys.Skip(1))
					{
						nQuery = desc
							? nQuery.ThenByDescending(x => EF.Property<object>(x, key))
							: nQuery.ThenBy(x => EF.Property<object>(x, key));
					}
					return nQuery;
				default:
					// The language should not require me to do this...
					throw new SwitchExpressionException();
			}
		}

		private static Func<Expression, Expression, BinaryExpression> GetComparisonExpression(
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
		protected Expression<Func<T, bool>> KeysetPaginatate(
			Sort<T> sort,
			T reference,
			bool next = true)
		{
			if (sort is Sort<T>.Default)
				sort = DefaultSort;

			// x =>
			ParameterExpression x = Expression.Parameter(typeof(T), "x");
			ConstantExpression referenceC = Expression.Constant(reference, typeof(T));

			if (sort is Sort<T>.By(var key, var desc))
			{
				Func<Expression, Expression, BinaryExpression> comparer = GetComparisonExpression(desc, next, false);
				MemberExpression xkey = Expression.Property(x, key);
				MemberExpression rkey = Expression.Property(referenceC, key);
				BinaryExpression compare = ApiHelper.StringCompatibleExpression(comparer, xkey, rkey);
				return Expression.Lambda<Func<T, bool>>(compare, x);
			}

			if (sort is Sort<T>.Conglomerate(var list))
			{
				throw new NotImplementedException();
				// BinaryExpression orExpression;
				//
				// foreach ((string key, bool desc) in list)
				// {
				// 	query.Where(x =>
				// }
			}
			throw new SwitchExpressionException();

			// Shamlessly stollen from https://github.com/mrahhal/MR.EntityFrameworkCore.KeysetPagination/blob/main/src/MR.EntityFrameworkCore.KeysetPagination/KeysetPaginationExtensions.cs#L191
			// // A composite keyset pagination in sql looks something like this:
			// //   (x, y, ...) > (a, b, ...)
			// // Where, x/y/... represent the column and a/b/... represent the reference's respective values.
			// //
			// // In sql standard this syntax is called "row value". Check here: https://use-the-index-luke.com/sql/partial-results/fetch-next-page#sb-row-values
			// // Unfortunately, not all databases support this properly.
			// // Further, if we were to use this we would somehow need EF Core to recognise it and translate it
			// // perhaps by using a new DbFunction (https://docs.microsoft.com/en-us/dotnet/api/microsoft.entityframeworkcore.dbfunctions).
			// // There's an ongoing issue for this here: https://github.com/dotnet/efcore/issues/26822
			// //
			// // In addition, row value won't work for mixed ordered columns. i.e if x > a but y < b.
			// // So even if we can use it we'll still have to fallback to this logic in these cases.
			// //
			// // The generalized expression for this in pseudocode is:
			// //   (x > a) OR
			// //   (x = a AND y > b) OR
			// //   (x = a AND y = b AND z > c) OR...
			// //
			// // Of course, this will be a bit more complex when ASC and DESC are mixed.
			// // Assume x is ASC, y is DESC, and z is ASC:
			// //   (x > a) OR
			// //   (x = a AND y < b) OR
			// //   (x = a AND y = b AND z > c) OR...
			// //
			// // An optimization is to include an additional redundant wrapping clause for the 1st column when there are
			// // more than one column we're acting on, which would allow the db to use it as an access predicate on the 1st column.
			// // See here: https://use-the-index-luke.com/sql/partial-results/fetch-next-page#sb-equivalent-logic
			//
			// var referenceValues = GetValues(columns, reference);
			//
			// MemberExpression firstMemberAccessExpression;
			// Expression firstReferenceValueExpression;
			//
			// // entity =>
			// ParameterExpression param = Expression.Parameter(typeof(T), "entity");
			//
			// BinaryExpression orExpression;
			// int innerLimit = 1;
			// // This loop compounds the outer OR expressions.
			// for (int i = 0; i < sort.list.Length; i++)
			// {
			// 	BinaryExpression andExpression;
			//
			// 	// This loop compounds the inner AND expressions.
			// 	// innerLimit implicitly grows from 1 to items.Count by each iteration.
			// 	for (int j = 0; j < innerLimit; j++)
			// 	{
			// 		bool isInnerLastOperation = j + 1 == innerLimit;
			// 		var column = columns[j];
			// 		var memberAccess = column.MakeMemberAccessExpression(param);
			// 		var referenceValue = referenceValues[j];
			// 		Expression<Func<object>> referenceValueFunc = () => referenceValue;
			// 		var referenceValueExpression = referenceValueFunc.Body;
			//
			// 		if (firstMemberAccessExpression == null)
			// 		{
			// 			// This might be used later on in an optimization.
			// 			firstMemberAccessExpression = memberAccess;
			// 			firstReferenceValueExpression = referenceValueExpression;
			// 		}
			//
			// 		BinaryExpression innerExpression;
			// 		if (!isInnerLastOperation)
			// 		{
			// 			innerExpression = Expression.Equal(
			// 				memberAccess,
			// 				EnsureMatchingType(memberAccess, referenceValueExpression));
			// 		}
			// 		else
			// 		{
			// 			var compare = GetComparisonExpressionToApply(direction, column, orEqual: false);
			// 			innerExpression = MakeComparisonExpression(
			// 				column,
			// 				memberAccess, referenceValueExpression,
			// 				compare);
			// 		}
			//
			// 		andExpression = andExpression == null ? innerExpression : Expression.And(andExpression, innerExpression);
			// 	}
			//
			// 	orExpression = orExpression == null ? andExpression : Expression.Or(orExpression, andExpression);
			//
			// 	innerLimit++;
			// }
			//
			// var finalExpression = orExpression;
			// if (columns.Count > 1)
			// {
			// 	// Implement the optimization that allows an access predicate on the 1st column.
			// 	// This is done by generating the following expression:
			// 	//   (x >=|<= a) AND (previous generated expression)
			// 	//
			// 	// This effectively adds a redundant clause on the 1st column, but it's a clause all dbs
			// 	// understand and can use as an access predicate (most commonly when the column is indexed).
			//
			// 	var firstColumn = columns[0];
			// 	var compare = GetComparisonExpressionToApply(direction, firstColumn, orEqual: true);
			// 	var accessPredicateClause = MakeComparisonExpression(
			// 		firstColumn,
			// 		firstMemberAccessExpression!, firstReferenceValueExpression!,
			// 		compare);
			// 	finalExpression = Expression.And(accessPredicateClause, finalExpression);
			// }
			//
			// return Expression.Lambda<Func<T, bool>>(finalExpression, param);
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
				query = query.Where(KeysetPaginatate(sort, reference));
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
