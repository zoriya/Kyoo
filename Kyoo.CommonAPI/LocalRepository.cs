using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Threading.Tasks;
using Kyoo.CommonApi;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Controllers
{
	public abstract class LocalRepository<T, TInternal> : IRepository<T>
		where T : class, IResource
		where TInternal : class, T
	{
		private readonly DbContext _database;

		protected abstract Expression<Func<TInternal, object>> DefaultSort { get; }


		protected LocalRepository(DbContext database)
		{
			_database = database;
		}
		
		public virtual void Dispose()
		{
			_database.Dispose();
		}

		public virtual ValueTask DisposeAsync()
		{
			return _database.DisposeAsync();
		}

		public Task<T> Get(int id)
		{
			return _Get(id).Cast<T>();
		}
		
		public Task<T> Get(string slug)
		{
			return _Get(slug).Cast<T>();
		}
		
		protected virtual Task<TInternal> _Get(int id)
		{
			return _database.Set<TInternal>().FirstOrDefaultAsync(x => x.ID == id);
		}

		protected virtual Task<TInternal> _Get(string slug)
		{
			return _database.Set<TInternal>().FirstOrDefaultAsync(x => x.Slug == slug);
		}

		public abstract Task<ICollection<T>> Search(string query);
		
		public virtual Task<ICollection<T>> GetAll(Expression<Func<T, bool>> where = null,
			Sort<T> sort = default,
			Pagination limit = default)
		{
			return ApplyFilters(_database.Set<TInternal>(), where, sort, limit);
		}
		
		protected async Task<ICollection<T>> ApplyFilters(IQueryable<TInternal> query,
			Expression<Func<T, bool>> where = null,
			Sort<T> sort = default, 
			Pagination limit = default)
		{
			ICollection<TInternal> items = await ApplyFilters(query, 
				_Get,
				DefaultSort,
				where.Convert<Func<TInternal, bool>>(), 
				sort.To<TInternal>(), 
				limit);

			return items.ToList<T>();
		}

		protected async Task<ICollection<T>> ApplyFilters(IQueryable<TInternal> query,
			Expression<Func<TInternal, bool>> where = null,
			Sort<TInternal> sort = default, 
			Pagination limit = default)
		{
			ICollection<TInternal> items = await ApplyFilters(query, _Get, DefaultSort, where, sort, limit);
			return items.ToList<T>();
		}
		
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

			if (limit.AfterID != 0)
			{
				TValue after = await get(limit.AfterID);
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

		public abstract Task<T> Create(T obj);

		public virtual async Task<T> CreateIfNotExists(T obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			T old = await Get(obj.Slug);
			if (old != null)
				return old;
			try
			{
				return await Create(obj);
			}
			catch (DuplicatedItemException)
			{
				old = await Get(obj.Slug);
				if (old == null)
					throw new SystemException("Unknown database state.");
				return old;
			}
		}

		public virtual async Task<T> Edit(T edited, bool resetOld)
		{
			if (edited == null)
				throw new ArgumentNullException(nameof(edited));
			
			TInternal old = (TInternal)await Get(edited.Slug);

			if (old == null)
				throw new ItemNotFound($"No ressource found with the slug {edited.Slug}.");
			
			if (resetOld)
				Utility.Nullify(old);
			Utility.Merge(old, edited);
			await Validate(old);
			await _database.SaveChangesAsync();
			return old;
		}

		protected virtual Task Validate(TInternal ressource)
		{
			foreach (PropertyInfo property in typeof(TInternal).GetProperties()
				.Where(x => typeof(IEnumerable).IsAssignableFrom(x.PropertyType) 
				            && !typeof(string).IsAssignableFrom(x.PropertyType)))
			{
				object value = property.GetValue(ressource);
				if (value is ICollection || value == null)
					continue;
				value = Utility.RunGenericMethod(typeof(Enumerable), "ToList", Utility.GetEnumerableType((IEnumerable)value), new [] { value});
				property.SetValue(ressource, value);
			}
			return Task.CompletedTask;
		}

		public virtual async Task Delete(int id)
		{
			T ressource = await Get(id);
			await Delete(ressource);
		}

		public virtual async Task Delete(string slug)
		{
			T ressource = await Get(slug);
			await Delete(ressource);
		}

		public abstract Task Delete(T obj);

		public virtual async Task DeleteRange(IEnumerable<T> objs)
		{
			foreach (T obj in objs)
				await Delete(obj);
		}
		
		public virtual async Task DeleteRange(IEnumerable<int> ids)
		{
			foreach (int id in ids)
				await Delete(id);
		}
		
		public virtual async Task DeleteRange(IEnumerable<string> slugs)
		{
			foreach (string slug in slugs)
				await Delete(slug);
		}
	}
}