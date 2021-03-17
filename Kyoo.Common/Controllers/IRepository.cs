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
		
		public static implicit operator Pagination(int limit) => new(limit);
	}

	public struct Sort<T>
	{
		public Expression<Func<T, object>> Key;
		public bool Descendant;
		
		public Sort(Expression<Func<T, object>> key, bool descendant = false)
		{
			Key = key;
			Descendant = descendant;
			
			if (!Utility.IsPropertyExpression(Key))
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

			Descendant = order switch
			{
				"desc" => true,
				"asc" => false,
				null => false,
				_ => throw new ArgumentException($"The sort order, if set, should be :asc or :desc but it was :{order}.")
			};
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

		Task<int> GetCount(Expression<Func<T, bool>> where = null);
		
		
		Task<T> Create([NotNull] T obj);
		Task<T> CreateIfNotExists([NotNull] T obj, bool silentFail = false);
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
		Task DeleteRange([NotNull] Expression<Func<T, bool>> where);
	}

	public interface IShowRepository : IRepository<Show>
	{
		Task AddShowLink(int showID, int? libraryID, int? collectionID);

		Task<string> GetSlug(int showID);
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

	public interface ITrackRepository : IRepository<Track>
	{
		Task<Track> Get(string slug, StreamType type = StreamType.Unknown);
	}
	
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
		
		Task<ICollection<PeopleRole>> GetFromPeople(int showID,
			Expression<Func<PeopleRole, bool>> where = null, 
			Sort<PeopleRole> sort = default,
			Pagination limit = default);
		Task<ICollection<PeopleRole>> GetFromPeople(int showID,
			[Optional] Expression<Func<PeopleRole, bool>> where,
			Expression<Func<PeopleRole, object>> sort,
			Pagination limit = default
		) => GetFromPeople(showID, where, new Sort<PeopleRole>(sort), limit);
		
		Task<ICollection<PeopleRole>> GetFromPeople(string showSlug,
			Expression<Func<PeopleRole, bool>> where = null, 
			Sort<PeopleRole> sort = default,
			Pagination limit = default);
		Task<ICollection<PeopleRole>> GetFromPeople(string showSlug,
			[Optional] Expression<Func<PeopleRole, bool>> where,
			Expression<Func<PeopleRole, object>> sort,
			Pagination limit = default
		) => GetFromPeople(showSlug, where, new Sort<PeopleRole>(sort), limit);
	}

	public interface IProviderRepository : IRepository<ProviderID>
	{
		Task<ICollection<MetadataID>> GetMetadataID(Expression<Func<MetadataID, bool>> where = null, 
			Sort<MetadataID> sort = default,
			Pagination limit = default);

		Task<ICollection<MetadataID>> GetMetadataID([Optional] Expression<Func<MetadataID, bool>> where,
			Expression<Func<MetadataID, object>> sort,
			Pagination limit = default
		) => GetMetadataID(where, new Sort<MetadataID>(sort), limit);
	}
}
