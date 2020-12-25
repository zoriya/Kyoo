using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Threading.Tasks;
using JetBrains.Annotations;
using Kyoo.CommonApi;
using Kyoo.Models;
using Kyoo.Models.Attributes;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace Kyoo.Controllers
{
	public abstract class LocalRepository<T>
		where T : class, IResource
	{
		protected readonly DbContext Database;

		protected abstract Expression<Func<T, object>> DefaultSort { get; }
		
		
		protected LocalRepository(DbContext database)
		{
			Database = database;
		}
		
		public virtual void Dispose()
		{
			Database.Dispose();
		}

		public virtual ValueTask DisposeAsync()
		{
			return Database.DisposeAsync();
		}
		
		public virtual Task<T> Get(int id)
		{
			return Database.Set<T>().FirstOrDefaultAsync(x => x.ID == id);
		}

		public virtual Task<T> Get(string slug)
		{
			return Database.Set<T>().FirstOrDefaultAsync(x => x.Slug == slug);
		}

		public virtual Task<T> Get(Expression<Func<T, bool>> predicate)
		{
			return Database.Set<T>().FirstOrDefaultAsync(predicate);
		}
		
		public virtual Task<ICollection<T>> GetAll(Expression<Func<T, bool>> where = null,
			Sort<T> sort = default,
			Pagination limit = default)
		{
			return ApplyFilters(Database.Set<T>(), where, sort, limit);
		}
		
		protected Task<ICollection<T>> ApplyFilters(IQueryable<T> query,
			Expression<Func<T, bool>> where = null,
			Sort<T> sort = default, 
			Pagination limit = default)
		{
			return ApplyFilters(query, Get, DefaultSort, where, sort, limit);
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

		public virtual Task<int> GetCount(Expression<Func<T, bool>> where = null)
		{
			IQueryable<T> query = Database.Set<T>();
			if (where != null)
				query = query.Where(where);
			return query.CountAsync();
		}

		public virtual async Task<T> Create([NotNull] T obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			await Validate(obj);
			return obj;
		}

		public virtual async Task<T> CreateIfNotExists(T obj, bool silentFail = false)
		{
			try
			{
				if (obj == null)
					throw new ArgumentNullException(nameof(obj));

				T old = await Get(obj.Slug);
				if (old != null)
					return old;
				
				return await Create(obj);
			}
			catch (DuplicatedItemException)
			{
				T old = await Get(obj!.Slug);
				if (old == null)
					throw new SystemException("Unknown database state.");
				return old;
			}
			catch
			{
				if (silentFail)
					return default;
				throw;
			}
		}
		
		public virtual async Task<T> Edit(T edited, bool resetOld)
		{
			if (edited == null)
				throw new ArgumentNullException(nameof(edited));

			Database.ChangeTracker.LazyLoadingEnabled = false;
			try
			{
				T old = await Get(edited.ID);

				if (old == null)
					throw new ItemNotFound($"No resource found with the ID {edited.ID}.");
				
				foreach (NavigationEntry navigation in Database.Entry(old).Navigations)
					if (navigation.Metadata.PropertyInfo.GetCustomAttribute<EditableRelation>() != null
					    && navigation.Metadata.GetGetter().GetClrValue(edited) != default)
						await navigation.LoadAsync();

				if (resetOld)
					Utility.Nullify(old);
				Utility.Complete(old, edited);
				await Validate(old);
				await Database.SaveChangesAsync();
				return old;
			}
			finally
			{
				Database.ChangeTracker.LazyLoadingEnabled = true;
			}
		}

		protected virtual Task Validate(T resource)
		{
			if (string.IsNullOrEmpty(resource.Slug))
				throw new ArgumentException("Resource can't have null as a slug.");
			if (int.TryParse(resource.Slug, out int _))
			{
				try
				{
					MethodInfo setter = typeof(T).GetProperty(nameof(resource.Slug))!.GetSetMethod();
					if (setter != null)
						setter.Invoke(resource, new object[] {resource.Slug + '!'});
					else
						throw new ArgumentException("Resources slug can't be number only.");
				}
				catch
				{
					throw new ArgumentException("Resources slug can't be number only.");
				}
			}
			
			foreach (PropertyInfo property in typeof(T).GetProperties()
				.Where(x => typeof(IEnumerable).IsAssignableFrom(x.PropertyType) 
				            && !typeof(string).IsAssignableFrom(x.PropertyType)))
			{
				object value = property.GetValue(resource);
				if (value is ICollection || value == null)
					continue;
				value = Utility.RunGenericMethod(typeof(Enumerable), "ToList", Utility.GetEnumerableType((IEnumerable)value), value);
				property.SetValue(resource, value);
			}
			return Task.CompletedTask;
		}
		
		public virtual async Task Delete(int id)
		{
			T resource = await Get(id);
			await Delete(resource);
		}

		public virtual async Task Delete(string slug)
		{
			T resource = await Get(slug);
			await Delete(resource);
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
	
	public abstract class LocalRepository<T, TInternal> : LocalRepository<TInternal>, IRepository<T>
		where T : class, IResource
		where TInternal : class, T, new()
	{
		protected LocalRepository(DbContext database) : base(database) { }

		public new Task<T> Get(int id)
		{
			return base.Get(id).Cast<T>();
		}
		
		public new Task<T> Get(string slug)
		{
			return base.Get(slug).Cast<T>();
		}

		public Task<T> Get(Expression<Func<T, bool>> predicate)
		{
			return Get(predicate.Convert<Func<TInternal, bool>>()).Cast<T>();
		}

		public abstract Task<ICollection<T>> Search(string query);
		
		public virtual Task<ICollection<T>> GetAll(Expression<Func<T, bool>> where = null,
			Sort<T> sort = default,
			Pagination limit = default)
		{
			return ApplyFilters(Database.Set<TInternal>(), where, sort, limit);
		}
		
		protected virtual async Task<ICollection<T>> ApplyFilters(IQueryable<TInternal> query,
			Expression<Func<T, bool>> where = null,
			Sort<T> sort = default, 
			Pagination limit = default)
		{
			ICollection<TInternal> items = await ApplyFilters(query, 
				base.Get,
				DefaultSort,
				where.Convert<Func<TInternal, bool>>(), 
				sort.To<TInternal>(), 
				limit);

			return items.ToList<T>();
		}
		
		public virtual Task<int> GetCount(Expression<Func<T, bool>> where = null)
		{
			IQueryable<TInternal> query = Database.Set<TInternal>();
			if (where != null)
				query = query.Where(where.Convert<Func<TInternal, bool>>());
			return query.CountAsync();
		}

		Task<T> IRepository<T>.Create(T item)
		{
			TInternal obj = item as TInternal ?? new TInternal();
			if (!(item is TInternal))
				Utility.Assign(obj, item);
			
			return Create(obj).Cast<T>()
				.Then(x => item.ID = x.ID);
		}

		Task<T> IRepository<T>.CreateIfNotExists(T item, bool silentFail)
		{
			TInternal obj = item as TInternal ?? new TInternal();
			if (!(item is TInternal))
				Utility.Assign(obj, item);
			
			return CreateIfNotExists(obj, silentFail).Cast<T>()
				.Then(x => item.ID = x.ID);
		}

		public Task<T> Edit(T edited, bool resetOld)
		{
			if (edited is TInternal intern)
				return Edit(intern, resetOld).Cast<T>();
			TInternal obj = new TInternal();
			Utility.Assign(obj, edited);
			return base.Edit(obj, resetOld).Cast<T>();
		}

		public abstract override Task Delete([NotNull] TInternal obj);

		Task IRepository<T>.Delete(T obj)
		{
			if (obj is TInternal intern)
				return Delete(intern);
			TInternal item = new TInternal();
			Utility.Assign(item, obj);
			return Delete(item);
		}
		
		public virtual async Task DeleteRange(IEnumerable<T> objs)
		{
			foreach (T obj in objs)
				await ((IRepository<T>)this).Delete(obj);
		}
	}
}