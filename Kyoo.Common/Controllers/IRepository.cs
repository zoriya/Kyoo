using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using JetBrains.Annotations;
using Kyoo.Models;

namespace Kyoo.Controllers
{
	public readonly struct Pagination
	{
		public int Count { get; }
		public int AfterID { get; }

		public Pagination(int count, int afterID = 0)
		{
			Count = count;
			AfterID = afterID;
		}
		
		public static implicit operator Pagination(int limit) => new Pagination(limit);
	}

	public struct Sort<T>
	{
		public Expression<Func<T, object>> Key;
		public bool Descendant;
		
		public Sort(Expression<Func<T, object>> key, bool descendant = false)
		{
			Key = ExpressionRewrite.Rewrite<Func<T, object>>(key);
			Descendant = descendant;
			
			if (Key == null || 
			    Key.Body is MemberExpression || 
			    Key.Body.NodeType == ExpressionType.Convert && ((UnaryExpression)Key.Body).Operand is MemberExpression)
				return;
				
			throw new ArgumentException("The given sort key is not valid.");
		}

		public Sort(string sortBy)
		{
			if (string.IsNullOrEmpty(sortBy))
			{
				Key = null;
				Descendant = false;
				return;
			}
			
			string key = sortBy.Contains(':') ? sortBy.Substring(0, sortBy.IndexOf(':')) : sortBy;
			string order = sortBy.Contains(':') ? sortBy.Substring(sortBy.IndexOf(':') + 1) : null;

			ParameterExpression param = Expression.Parameter(typeof(T), "x");
			MemberExpression property = Expression.Property(param, key);
			Key = property.Type.IsValueType
				? Expression.Lambda<Func<T, object>>(Expression.Convert(property, typeof(object)), param)
				: Expression.Lambda<Func<T, object>>(property, param);
			Key = ExpressionRewrite.Rewrite<Func<T, object>>(Key);
					
			Descendant = order switch
			{
				"desc" => true,
				"asc" => false,
				null => false,
				_ => throw new ArgumentException($"The sort order, if set, should be :asc or :desc but it was :{order}.")
			};
		}

		public Sort<TValue> To<TValue>()
		{
			return new Sort<TValue>(Key.Convert<Func<TValue, object>>(), Descendant);
		}
	}
	
	public interface IRepository<T> : IDisposable, IAsyncDisposable where T : class, IResource
	{
		Task<T> Get(int id);
		Task<T> Get(string slug);
		Task<T> Get(Expression<Func<T, bool>> where);
		Task<ICollection<T>> Search(string query);
		
		Task<ICollection<T>> GetAll(Expression<Func<T, bool>> where = null, 
			Sort<T> sort = default,
			Pagination limit = default);

		Task<ICollection<T>> GetAll([Optional] Expression<Func<T, bool>> where,
			Expression<Func<T, object>> sort,
			Pagination limit = default
		) => GetAll(where, new Sort<T>(sort), limit);
		
		Task<T> Create([NotNull] T obj);
		Task<T> CreateIfNotExists([NotNull] T obj);
		async Task<T> CreateIfNotExists([NotNull] T obj, bool silentFail)
		{
			try
			{
				return await CreateIfNotExists(obj);
			}
			catch
			{
				if (!silentFail)
					throw;
				return null;
			}
		}
		Task<T> Edit([NotNull] T edited, bool resetOld);
		
		Task Delete(int id);
		Task Delete(string slug);
		Task Delete([NotNull] T obj);

		Task DeleteRange(params T[] objs) => DeleteRange(objs.AsEnumerable());
		Task DeleteRange(IEnumerable<T> objs);
		Task DeleteRange(params int[] ids) => DeleteRange(ids.AsEnumerable());
		Task DeleteRange(IEnumerable<int> ids);
		Task DeleteRange(params string[] slugs) => DeleteRange(slugs.AsEnumerable());
		Task DeleteRange(IEnumerable<string> slugs);
	}

	public interface IShowRepository : IRepository<Show>
	{
		Task AddShowLink(int showID, int? libraryID, int? collectionID);
	}

	public interface ISeasonRepository : IRepository<Season>
	{
		Task<Season> Get(int showID, int seasonNumber);
		Task<Season> Get(string showSlug, int seasonNumber);
		Task Delete(string showSlug, int seasonNumber);
	}
	
	public interface IEpisodeRepository : IRepository<Episode>
	{
		Task<Episode> Get(int showID, int seasonNumber, int episodeNumber);
		Task<Episode> Get(string showSlug, int seasonNumber, int episodeNumber);
		Task<Episode> Get(int seasonID, int episodeNumber);
		Task<Episode> GetAbsolute(int showID, int absoluteNumber);
		Task<Episode> GetAbsolute(string showSlug, int absoluteNumber);
		Task Delete(string showSlug, int seasonNumber, int episodeNumber);
	}

	public interface ITrackRepository : IRepository<Track> { }
	public interface ILibraryRepository : IRepository<Library> { }

	public interface ILibraryItemRepository : IRepository<LibraryItem>
	{
		public Task<ICollection<LibraryItem>> GetFromLibrary(int id,
			Expression<Func<LibraryItem, bool>> where = null,
			Sort<LibraryItem> sort = default,
			Pagination limit = default);

		public Task<ICollection<LibraryItem>> GetFromLibrary(int id,
			[Optional] Expression<Func<LibraryItem, bool>> where,
			Expression<Func<LibraryItem, object>> sort,
			Pagination limit = default
		) => GetFromLibrary(id, where, new Sort<LibraryItem>(sort), limit);
		
		public Task<ICollection<LibraryItem>> GetFromLibrary(string librarySlug,
			Expression<Func<LibraryItem, bool>> where = null,
			Sort<LibraryItem> sort = default,
			Pagination limit = default);

		public Task<ICollection<LibraryItem>> GetFromLibrary(string librarySlug,
			[Optional] Expression<Func<LibraryItem, bool>> where,
			Expression<Func<LibraryItem, object>> sort,
			Pagination limit = default
		) => GetFromLibrary(librarySlug, where, new Sort<LibraryItem>(sort), limit);
	}	
		
	public interface ICollectionRepository : IRepository<Collection> { }
	public interface IGenreRepository : IRepository<Genre> { }
	public interface IStudioRepository : IRepository<Studio> { }

	public interface IPeopleRepository : IRepository<People>
	{
		Task<ICollection<PeopleRole>> GetFromShow(int showID,
			Expression<Func<PeopleRole, bool>> where = null, 
			Sort<PeopleRole> sort = default,
			Pagination limit = default);
		Task<ICollection<PeopleRole>> GetFromShow(int showID,
			[Optional] Expression<Func<PeopleRole, bool>> where,
			Expression<Func<PeopleRole, object>> sort,
			Pagination limit = default
		) => GetFromShow(showID, where, new Sort<PeopleRole>(sort), limit);
		
		Task<ICollection<PeopleRole>> GetFromShow(string showSlug,
			Expression<Func<PeopleRole, bool>> where = null, 
			Sort<PeopleRole> sort = default,
			Pagination limit = default);
		Task<ICollection<PeopleRole>> GetFromShow(string showSlug,
			[Optional] Expression<Func<PeopleRole, bool>> where,
			Expression<Func<PeopleRole, object>> sort,
			Pagination limit = default
		) => GetFromShow(showSlug, where, new Sort<PeopleRole>(sort), limit);
		
		Task<ICollection<ShowRole>> GetFromPeople(int showID,
			Expression<Func<ShowRole, bool>> where = null, 
			Sort<ShowRole> sort = default,
			Pagination limit = default);
		Task<ICollection<ShowRole>> GetFromPeople(int showID,
			[Optional] Expression<Func<ShowRole, bool>> where,
			Expression<Func<ShowRole, object>> sort,
			Pagination limit = default
		) => GetFromPeople(showID, where, new Sort<ShowRole>(sort), limit);
		
		Task<ICollection<ShowRole>> GetFromPeople(string showSlug,
			Expression<Func<ShowRole, bool>> where = null, 
			Sort<ShowRole> sort = default,
			Pagination limit = default);
		Task<ICollection<ShowRole>> GetFromPeople(string showSlug,
			[Optional] Expression<Func<ShowRole, bool>> where,
			Expression<Func<ShowRole, object>> sort,
			Pagination limit = default
		) => GetFromPeople(showSlug, where, new Sort<ShowRole>(sort), limit);
	}
	
	public interface IProviderRepository : IRepository<ProviderID> {}
}