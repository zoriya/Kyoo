using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Threading.Tasks;
using Kyoo.CommonApi;
using Kyoo.Models;
using Kyoo.Models.Attributes;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata;

namespace Kyoo.Controllers
{
	public abstract class LocalRepository<T> : IRepository<T>
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
			GC.SuppressFinalize(this);
		}

		public virtual ValueTask DisposeAsync()
		{
			return Database.DisposeAsync();
		}
		
		public virtual Task<T> Get(int id)
		{
			return Database.Set<T>().FirstOrDefaultAsync(x => x.ID == id);
		}
		
		public virtual Task<T> GetWithTracking(int id)
		{
			return Database.Set<T>().AsTracking().FirstOrDefaultAsync(x => x.ID == id);
		}

		public virtual Task<T> Get(string slug)
		{
			return Database.Set<T>().FirstOrDefaultAsync(x => x.Slug == slug);
		}

		public virtual Task<T> Get(Expression<Func<T, bool>> predicate)
		{
			return Database.Set<T>().FirstOrDefaultAsync(predicate);
		}
		
		public abstract Task<ICollection<T>> Search(string query);
		
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

		public virtual async Task<T> Create(T obj)
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

			bool lazyLoading = Database.ChangeTracker.LazyLoadingEnabled;
			Database.ChangeTracker.LazyLoadingEnabled = false;
			try
			{
				T old = await GetWithTracking(edited.ID);

				if (old == null)
					throw new ItemNotFound($"No resource found with the ID {edited.ID}.");

				List<PropertyInfo> navigations = typeof(T).GetProperties()
					.Where(x => x.GetCustomAttribute<EditableRelationAttribute>() != null)
					.ToList();
				List<string> links = typeof(T).GetProperties()
					.Select(x => x.GetCustomAttribute<LinkRelationAttribute>()?.Relation)
					.Where(x => x != null)
					.ToList();
				
				// This handle every links so every Many to Many
				// TODO should handle non links value (One to Many)
				foreach (string relationName in links)
				{
					PropertyInfo relation = navigations.Find(x => x.Name == relationName);
					navigations.Remove(relation);

					if (relation!.GetValue(edited) == null && !resetOld)
						continue;

					await _library.Load(old, relation.Name);
					IEnumerable<IResource> oValues = (relation.GetValue(old) as IEnumerable)!.Cast<IResource>();
					List<IResource> nValues = (relation.GetValue(edited) as IEnumerable)?.Cast<IResource>().ToList();
					
					foreach (IResource x in oValues)
					{
						int nIndex = nValues?.FindIndex(y => Utility.ResourceEquals(x, y)) ?? -1;
						if (nIndex == -1 || resetOld)
							await _linkManager.Delete(old, x);
						else
							nValues!.RemoveAt(nIndex);
					}
					
					await nValues.ForEachAsync(x => _linkManager.Add(old, x));
				}

				// This handle every X to One
				foreach (PropertyInfo relation in navigations)
				{
					IResource oValues = relation.GetValue(old) as IResource;
					IResource nValues = relation.GetValue(edited) as IResource;

					if (nValues == null && !resetOld)
						continue;

					if (false) // TODO change if false with if relation is casquade delete
						await _library.Delete(oValue);
					relation.SetValue(old, nValues);
					// TODO call create if not exist
					// TODO change relationID to the new value ID.
				}
				
				
				// This handle every One to Many or Many to One
				foreach (PropertyInfo navigation in  navigations)
				{
					if (resetOld || navigation.GetValue(edited) != default)
					{
						// TODO only works for X To One and not X to Many
						await _library.Value.Load(old, navigation.Name);
						object value = navigation.GetValue(old);
						if (value is IEnumerable list) // TODO handle externalIds & PeopleRoles (implement Link<> for those)
							list.ForEach(x => _library.Value.Delete(x));
						else if (value is IResource resource)
							_library.Value.Delete(resource);
					}
					
					
					if (navigation.GetCustomAttribute<EditableRelationAttribute>() == null)
					{
						navigation.SetValue(edited, default);
						continue;
					}
				}

				if (resetOld)
					Utility.Nullify(old);
				Utility.Complete(old, edited);
				await Validate(old);
				await Database.SaveChangesAsync();
				return old;
			}
			finally
			{
				Database.ChangeTracker.LazyLoadingEnabled = lazyLoading;
			}
		}

		protected bool ShouldValidate<T2>(T2 value)
		{
			return value != null && Database.Entry(value).State == EntityState.Detached;
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
}