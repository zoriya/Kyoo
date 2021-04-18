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
	/// <summary>
	/// Informations about the pagination. How many items should be displayed and where to start.
	/// </summary>
	public readonly struct Pagination
	{
		/// <summary>
		/// The count of items to return.
		/// </summary>
		public int Count { get; }
		/// <summary>
		/// Where to start? Using the given sort
		/// </summary>
		public int AfterID { get; }

		/// <summary>
		/// Create a new <see cref="Pagination"/> instance.
		/// </summary>
		/// <param name="count">Set the <see cref="Count"/> value</param>
		/// <param name="afterID">Set the <see cref="AfterID"/> value. If not specified, it will start from the start</param>
		public Pagination(int count, int afterID = 0)
		{
			Count = count;
			AfterID = afterID;
		}
		
		/// <summary>
		/// Implicitly create a new pagination from a limit number.
		/// </summary>
		/// <param name="limit">Set the <see cref="Count"/> value</param>
		/// <returns>A new <see cref="Pagination"/> instance</returns>
		public static implicit operator Pagination(int limit) => new(limit);
	}

	/// <summary>
	/// Informations about how a query should be sorted. What factor should decide the sort and in which order.
	/// </summary>
	/// <typeparam name="T">For witch type this sort applies</typeparam>
	public readonly struct Sort<T>
	{
		/// <summary>
		/// The sort key. This member will be used to sort the results.
		/// </summary>
		public Expression<Func<T, object>> Key { get; }
		/// <summary>
		/// If this is set to true, items will be sorted in descend order else, they will be sorted in ascendent order.
		/// </summary>
		public bool Descendant { get; }
		
		/// <summary>
		/// Create a new <see cref="Sort{T}"/> instance.
		/// </summary>
		/// <param name="key">The sort key given. It is assigned to <see cref="Key"/>.</param>
		/// <param name="descendant">Should this be in descendant order? The default is false.</param>
		/// <exception cref="ArgumentException">If the given key is not a member.</exception>
		public Sort(Expression<Func<T, object>> key, bool descendant = false)
		{
			Key = key;
			Descendant = descendant;
			
			if (!Utility.IsPropertyExpression(Key))
				throw new ArgumentException("The given sort key is not valid.");
		}

		/// <summary>
		/// Create a new <see cref="Sort{T}"/> instance from a key's name (case insensitive).
		/// </summary>
		/// <param name="sortBy">A key name with an optional order specifier. Format: "key:asc", "key:desc" or "key".</param>
		/// <exception cref="ArgumentException">An invalid key or sort specifier as been given.</exception>
		public Sort(string sortBy)
		{
			if (string.IsNullOrEmpty(sortBy))
			{
				Key = null;
				Descendant = false;
				return;
			}
			
			string key = sortBy.Contains(':') ? sortBy[..sortBy.IndexOf(':')] : sortBy;
			string order = sortBy.Contains(':') ? sortBy[(sortBy.IndexOf(':') + 1)..] : null;

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

	/// <summary>
	/// A base class for repositories. Every service implementing this will be handled by the <see cref="LibraryManager"/>.
	/// </summary>
	public interface IBaseRepository : IDisposable, IAsyncDisposable
	{
		/// <summary>
		/// The type for witch this repository is responsible.
		/// </summary>
		Type RepositoryType { get; }
	}
	
	public interface IRepository<T> : IBaseRepository where T : class, IResource
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

	public interface IProviderRepository : IRepository<Provider>
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
