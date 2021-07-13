using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using JetBrains.Annotations;
using Kyoo.Models;
using Kyoo.Models.Exceptions;

namespace Kyoo.Controllers
{
	/// <summary>
	/// Information about the pagination. How many items should be displayed and where to start.
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
	/// Information about how a query should be sorted. What factor should decide the sort and in which order.
	/// </summary>
	/// <typeparam name="T">For witch type this sort applies</typeparam>
	public readonly struct Sort<T>
	{
		/// <summary>
		/// The sort key. This member will be used to sort the results.
		/// </summary>
		public Expression<Func<T, object>> Key { get; }
		/// <summary>
		/// If this is set to true, items will be sorted in descend order else, they will be sorted in ascendant order.
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
	public interface IBaseRepository
	{
		/// <summary>
		/// The type for witch this repository is responsible or null if non applicable.
		/// </summary>
		Type RepositoryType { get; }
	}
	
	/// <summary>
	/// A common repository for every resources.
	/// </summary>
	/// <typeparam name="T">The resource's type that this repository manage.</typeparam>
	public interface IRepository<T> : IBaseRepository where T : class, IResource
	{
		/// <summary>
		/// Get a resource from it's ID.
		/// </summary>
		/// <param name="id">The id of the resource</param>
		/// <exception cref="ItemNotFoundException">If the item could not be found.</exception>
		/// <returns>The resource found</returns>
		Task<T> Get(int id);
		/// <summary>
		/// Get a resource from it's slug.
		/// </summary>
		/// <param name="slug">The slug of the resource</param>
		/// <exception cref="ItemNotFoundException">If the item could not be found.</exception>
		/// <returns>The resource found</returns>
		Task<T> Get(string slug);
		/// <summary>
		/// Get the first resource that match the predicate.
		/// </summary>
		/// <param name="where">A predicate to filter the resource.</param>
		/// <exception cref="ItemNotFoundException">If the item could not be found.</exception>
		/// <returns>The resource found</returns>
		Task<T> Get(Expression<Func<T, bool>> where);
		
		/// <summary>
		/// Get a resource from it's ID or null if it is not found.
		/// </summary>
		/// <param name="id">The id of the resource</param>
		/// <returns>The resource found</returns>
		Task<T> GetOrDefault(int id);
		/// <summary>
		/// Get a resource from it's slug or null if it is not found.
		/// </summary>
		/// <param name="slug">The slug of the resource</param>
		/// <returns>The resource found</returns>
		Task<T> GetOrDefault(string slug);
		/// <summary>
		/// Get the first resource that match the predicate or null if it is not found.
		/// </summary>
		/// <param name="where">A predicate to filter the resource.</param>
		/// <returns>The resource found</returns>
		Task<T> GetOrDefault(Expression<Func<T, bool>> where);
		
		/// <summary>
		/// Search for resources.
		/// </summary>
		/// <param name="query">The query string.</param>
		/// <returns>A list of resources found</returns>
		Task<ICollection<T>> Search(string query);
		
		/// <summary>
		/// Get every resources that match all filters
		/// </summary>
		/// <param name="where">A filter predicate</param>
		/// <param name="sort">Sort information about the query (sort by, sort order)</param>
		/// <param name="limit">How pagination should be done (where to start and how many to return)</param>
		/// <returns>A list of resources that match every filters</returns>
		Task<ICollection<T>> GetAll(Expression<Func<T, bool>> where = null, 
			Sort<T> sort = default,
			Pagination limit = default);
		/// <summary>
		/// Get every resources that match all filters
		/// </summary>
		/// <param name="where">A filter predicate</param>
		/// <param name="sort">A sort by predicate. The order is ascending.</param>
		/// <param name="limit">How pagination should be done (where to start and how many to return)</param>
		/// <returns>A list of resources that match every filters</returns>
		Task<ICollection<T>> GetAll([Optional] Expression<Func<T, bool>> where,
			Expression<Func<T, object>> sort,
			Pagination limit = default
		) => GetAll(where, new Sort<T>(sort), limit);

		/// <summary>
		/// Get the number of resources that match the filter's predicate.
		/// </summary>
		/// <param name="where">A filter predicate</param>
		/// <returns>How many resources matched that filter</returns>
		Task<int> GetCount(Expression<Func<T, bool>> where = null);
		
		
		/// <summary>
		/// Create a new resource.
		/// </summary>
		/// <param name="obj">The item to register</param>
		/// <returns>The resource registers and completed by database's information (related items & so on)</returns>
		Task<T> Create([NotNull] T obj);
		
		/// <summary>
		/// Create a new resource if it does not exist already. If it does, the existing value is returned instead.
		/// </summary>
		/// <param name="obj">The object to create</param>
		/// <returns>The newly created item or the existing value if it existed.</returns>
		Task<T> CreateIfNotExists([NotNull] T obj);
		
		/// <summary>
		/// Edit a resource
		/// </summary>
		/// <param name="edited">The resource to edit, it's ID can't change.</param>
		/// <param name="resetOld">Should old properties of the resource be discarded or should null values considered as not changed?</param>
		/// <exception cref="ItemNotFoundException">If the item is not found</exception>
		/// <returns>The resource edited and completed by database's information (related items & so on)</returns>
		Task<T> Edit([NotNull] T edited, bool resetOld);
		
		/// <summary>
		/// Delete a resource by it's ID
		/// </summary>
		/// <param name="id">The ID of the resource</param>
		/// <exception cref="ItemNotFoundException">If the item is not found</exception>
		Task Delete(int id);
		/// <summary>
		/// Delete a resource by it's slug
		/// </summary>
		/// <param name="slug">The slug of the resource</param>
		/// <exception cref="ItemNotFoundException">If the item is not found</exception>
		Task Delete(string slug);
		/// <summary>
		/// Delete a resource
		/// </summary>
		/// <param name="obj">The resource to delete</param>
		/// <exception cref="ItemNotFoundException">If the item is not found</exception>
		Task Delete([NotNull] T obj);
		
		/// <summary>
		/// Delete all resources that match the predicate.
		/// </summary>
		/// <param name="where">A predicate to filter resources to delete. Every resource that match this will be deleted.</param>
		/// <exception cref="ItemNotFoundException">If the item is not found</exception>
		Task DeleteAll([NotNull] Expression<Func<T, bool>> where);
	}

	/// <summary>
	/// A repository to handle shows.
	/// </summary>
	public interface IShowRepository : IRepository<Show>
	{
		/// <summary>
		/// Link a show to a collection and/or a library. The given show is now part of those containers.
		/// If both a library and a collection are given, the collection is added to the library too.
		/// </summary>
		/// <param name="showID">The ID of the show</param>
		/// <param name="libraryID">The ID of the library (optional)</param>
		/// <param name="collectionID">The ID of the collection (optional)</param>
		Task AddShowLink(int showID, int? libraryID, int? collectionID);

		/// <summary>
		/// Get a show's slug from it's ID.
		/// </summary>
		/// <param name="showID">The ID of the show</param>
		/// <exception cref="ItemNotFoundException">If a show with the given ID is not found.</exception>
		/// <returns>The show's slug</returns>
		Task<string> GetSlug(int showID);
	}

	/// <summary>
	/// A repository to handle seasons.
	/// </summary>
	public interface ISeasonRepository : IRepository<Season>
	{
		/// <summary>
		/// Get a season from it's showID and it's seasonNumber
		/// </summary>
		/// <param name="showID">The id of the show</param>
		/// <param name="seasonNumber">The season's number</param>
		/// <exception cref="ItemNotFoundException">If the item is not found</exception>
		/// <returns>The season found</returns>
		Task<Season> Get(int showID, int seasonNumber);
		
		/// <summary>
		/// Get a season from it's show slug and it's seasonNumber
		/// </summary>
		/// <param name="showSlug">The slug of the show</param>
		/// <param name="seasonNumber">The season's number</param>
		/// <exception cref="ItemNotFoundException">If the item is not found</exception>
		/// <returns>The season found</returns>
		Task<Season> Get(string showSlug, int seasonNumber);
		
		/// <summary>
        /// Get a season from it's showID and it's seasonNumber or null if it is not found.
        /// </summary>
        /// <param name="showID">The id of the show</param>
        /// <param name="seasonNumber">The season's number</param>
        /// <returns>The season found</returns>
        Task<Season> GetOrDefault(int showID, int seasonNumber);
        
        /// <summary>
        /// Get a season from it's show slug and it's seasonNumber or null if it is not found.
        /// </summary>
        /// <param name="showSlug">The slug of the show</param>
        /// <param name="seasonNumber">The season's number</param>
        /// <returns>The season found</returns>
        Task<Season> GetOrDefault(string showSlug, int seasonNumber);
	}
	
	/// <summary>
	/// The repository to handle episodes
	/// </summary>
	public interface IEpisodeRepository : IRepository<Episode>
	{
		/// <summary>
		/// Get a episode from it's showID, it's seasonNumber and it's episode number.
		/// </summary>
		/// <param name="showID">The id of the show</param>
		/// <param name="seasonNumber">The season's number</param>
		/// <param name="episodeNumber">The episode's number</param>
		/// <exception cref="ItemNotFoundException">If the item is not found</exception>
		/// <returns>The episode found</returns>
		Task<Episode> Get(int showID, int seasonNumber, int episodeNumber);
		/// <summary>
		/// Get a episode from it's show slug, it's seasonNumber and it's episode number.
		/// </summary>
		/// <param name="showSlug">The slug of the show</param>
		/// <param name="seasonNumber">The season's number</param>
		/// <param name="episodeNumber">The episode's number</param>
		/// <exception cref="ItemNotFoundException">If the item is not found</exception>
		/// <returns>The episode found</returns>
		Task<Episode> Get(string showSlug, int seasonNumber, int episodeNumber);

		/// <summary>
		/// Get a episode from it's showID, it's seasonNumber and it's episode number or null if it is not found.
		/// </summary>
		/// <param name="showID">The id of the show</param>
		/// <param name="seasonNumber">The season's number</param>
		/// <param name="episodeNumber">The episode's number</param>
		/// <returns>The episode found</returns>
		Task<Episode> GetOrDefault(int showID, int seasonNumber, int episodeNumber);
		/// <summary>
		/// Get a episode from it's show slug, it's seasonNumber and it's episode number or null if it is not found.
		/// </summary>
		/// <param name="showSlug">The slug of the show</param>
		/// <param name="seasonNumber">The season's number</param>
		/// <param name="episodeNumber">The episode's number</param>
		/// <returns>The episode found</returns>
		Task<Episode> GetOrDefault(string showSlug, int seasonNumber, int episodeNumber);
		
		/// <summary>
		/// Get a episode from it's showID and it's absolute number.
		/// </summary>
		/// <param name="showID">The id of the show</param>
		/// <param name="absoluteNumber">The episode's absolute number (The episode number does not reset to 1 after the end of a season.</param>
		/// <exception cref="ItemNotFoundException">If the item is not found</exception>
		/// <returns>The episode found</returns>
		Task<Episode> GetAbsolute(int showID, int absoluteNumber);
		/// <summary>
		/// Get a episode from it's showID and it's absolute number.
		/// </summary>
		/// <param name="showSlug">The slug of the show</param>
		/// <param name="absoluteNumber">The episode's absolute number (The episode number does not reset to 1 after the end of a season.</param>
		/// <exception cref="ItemNotFoundException">If the item is not found</exception>
		/// <returns>The episode found</returns>
		Task<Episode> GetAbsolute(string showSlug, int absoluteNumber);
	}

	/// <summary>
	/// A repository to handle tracks
	/// </summary>
	public interface ITrackRepository : IRepository<Track> { }
	
	/// <summary>
	/// A repository to handle libraries.
	/// </summary>
	public interface ILibraryRepository : IRepository<Library> { }

	/// <summary>
	/// A repository to handle library items (A wrapper around shows and collections).
	/// </summary>
	public interface ILibraryItemRepository : IRepository<LibraryItem>
	{
		/// <summary>
		/// Get items (A wrapper around shows or collections) from a library.
		/// </summary>
		/// <param name="id">The ID of the library</param>
		/// <param name="where">A filter function</param>
		/// <param name="sort">Sort information (sort order & sort by)</param>
		/// <param name="limit">How many items to return and where to start</param>
		/// <returns>A list of items that match every filters</returns>
		public Task<ICollection<LibraryItem>> GetFromLibrary(int id,
			Expression<Func<LibraryItem, bool>> where = null,
			Sort<LibraryItem> sort = default,
			Pagination limit = default);
		/// <summary>
		/// Get items (A wrapper around shows or collections) from a library.
		/// </summary>
		/// <param name="id">The ID of the library</param>
		/// <param name="where">A filter function</param>
		/// <param name="sort">A sort by method</param>
		/// <param name="limit">How many items to return and where to start</param>
		/// <returns>A list of items that match every filters</returns>
		public Task<ICollection<LibraryItem>> GetFromLibrary(int id,
			[Optional] Expression<Func<LibraryItem, bool>> where,
			Expression<Func<LibraryItem, object>> sort,
			Pagination limit = default
		) => GetFromLibrary(id, where, new Sort<LibraryItem>(sort), limit);
		
		/// <summary>
		/// Get items (A wrapper around shows or collections) from a library.
		/// </summary>
		/// <param name="slug">The slug of the library</param>
		/// <param name="where">A filter function</param>
		/// <param name="sort">Sort information (sort order & sort by)</param>
		/// <param name="limit">How many items to return and where to start</param>
		/// <returns>A list of items that match every filters</returns>
		public Task<ICollection<LibraryItem>> GetFromLibrary(string slug,
			Expression<Func<LibraryItem, bool>> where = null,
			Sort<LibraryItem> sort = default,
			Pagination limit = default);
		/// <summary>
		/// Get items (A wrapper around shows or collections) from a library.
		/// </summary>
		/// <param name="slug">The slug of the library</param>
		/// <param name="where">A filter function</param>
		/// <param name="sort">A sort by method</param>
		/// <param name="limit">How many items to return and where to start</param>
		/// <returns>A list of items that match every filters</returns>
		public Task<ICollection<LibraryItem>> GetFromLibrary(string slug,
			[Optional] Expression<Func<LibraryItem, bool>> where,
			Expression<Func<LibraryItem, object>> sort,
			Pagination limit = default
		) => GetFromLibrary(slug, where, new Sort<LibraryItem>(sort), limit);
	}	
		
	/// <summary>
	/// A repository for collections
	/// </summary>
	public interface ICollectionRepository : IRepository<Collection> { }
	
	/// <summary>
	/// A repository for genres.
	/// </summary>
	public interface IGenreRepository : IRepository<Genre> { }
	
	/// <summary>
	/// A repository for studios.
	/// </summary>
	public interface IStudioRepository : IRepository<Studio> { }

	/// <summary>
	/// A repository for people.
	/// </summary>
	public interface IPeopleRepository : IRepository<People>
	{
		/// <summary>
		/// Get people's roles from a show.
		/// </summary>
		/// <param name="showID">The ID of the show</param>
		/// <param name="where">A filter function</param>
		/// <param name="sort">Sort information (sort order & sort by)</param>
		/// <param name="limit">How many items to return and where to start</param>
		/// <returns>A list of items that match every filters</returns>
		Task<ICollection<PeopleRole>> GetFromShow(int showID,
			Expression<Func<PeopleRole, bool>> where = null, 
			Sort<PeopleRole> sort = default,
			Pagination limit = default);
		/// <summary>
		/// Get people's roles from a show.
		/// </summary>
		/// <param name="showID">The ID of the show</param>
		/// <param name="where">A filter function</param>
		/// <param name="sort">A sort by method</param>
		/// <param name="limit">How many items to return and where to start</param>
		/// <returns>A list of items that match every filters</returns>
		Task<ICollection<PeopleRole>> GetFromShow(int showID,
			[Optional] Expression<Func<PeopleRole, bool>> where,
			Expression<Func<PeopleRole, object>> sort,
			Pagination limit = default
		) => GetFromShow(showID, where, new Sort<PeopleRole>(sort), limit);
		
		/// <summary>
		/// Get people's roles from a show.
		/// </summary>
		/// <param name="showSlug">The slug of the show</param>
		/// <param name="where">A filter function</param>
		/// <param name="sort">Sort information (sort order & sort by)</param>
		/// <param name="limit">How many items to return and where to start</param>
		/// <returns>A list of items that match every filters</returns>
		Task<ICollection<PeopleRole>> GetFromShow(string showSlug,
			Expression<Func<PeopleRole, bool>> where = null, 
			Sort<PeopleRole> sort = default,
			Pagination limit = default);
		/// <summary>
		/// Get people's roles from a show.
		/// </summary>
		/// <param name="showSlug">The slug of the show</param>
		/// <param name="where">A filter function</param>
		/// <param name="sort">A sort by method</param>
		/// <param name="limit">How many items to return and where to start</param>
		/// <returns>A list of items that match every filters</returns>
		Task<ICollection<PeopleRole>> GetFromShow(string showSlug,
			[Optional] Expression<Func<PeopleRole, bool>> where,
			Expression<Func<PeopleRole, object>> sort,
			Pagination limit = default
		) => GetFromShow(showSlug, where, new Sort<PeopleRole>(sort), limit);
		
		/// <summary>
		/// Get people's roles from a person.
		/// </summary>
		/// <param name="id">The id of the person</param>
		/// <param name="where">A filter function</param>
		/// <param name="sort">Sort information (sort order & sort by)</param>
		/// <param name="limit">How many items to return and where to start</param>
		/// <returns>A list of items that match every filters</returns>
		Task<ICollection<PeopleRole>> GetFromPeople(int id,
			Expression<Func<PeopleRole, bool>> where = null, 
			Sort<PeopleRole> sort = default,
			Pagination limit = default);
		/// <summary>
		/// Get people's roles from a person.
		/// </summary>
		/// <param name="id">The id of the person</param>
		/// <param name="where">A filter function</param>
		/// <param name="sort">A sort by method</param>
		/// <param name="limit">How many items to return and where to start</param>
		/// <returns>A list of items that match every filters</returns>
		Task<ICollection<PeopleRole>> GetFromPeople(int id,
			[Optional] Expression<Func<PeopleRole, bool>> where,
			Expression<Func<PeopleRole, object>> sort,
			Pagination limit = default
		) => GetFromPeople(id, where, new Sort<PeopleRole>(sort), limit);
		
		/// <summary>
		/// Get people's roles from a person.
		/// </summary>
		/// <param name="slug">The slug of the person</param>
		/// <param name="where">A filter function</param>
		/// <param name="sort">Sort information (sort order & sort by)</param>
		/// <param name="limit">How many items to return and where to start</param>
		/// <returns>A list of items that match every filters</returns>
		Task<ICollection<PeopleRole>> GetFromPeople(string slug,
			Expression<Func<PeopleRole, bool>> where = null, 
			Sort<PeopleRole> sort = default,
			Pagination limit = default);
		/// <summary>
		/// Get people's roles from a person.
		/// </summary>
		/// <param name="slug">The slug of the person</param>
		/// <param name="where">A filter function</param>
		/// <param name="sort">A sort by method</param>
		/// <param name="limit">How many items to return and where to start</param>
		/// <returns>A list of items that match every filters</returns>
		Task<ICollection<PeopleRole>> GetFromPeople(string slug,
			[Optional] Expression<Func<PeopleRole, bool>> where,
			Expression<Func<PeopleRole, object>> sort,
			Pagination limit = default
		) => GetFromPeople(slug, where, new Sort<PeopleRole>(sort), limit);
	}

	/// <summary>
	/// A repository to handle providers.
	/// </summary>
	public interface IProviderRepository : IRepository<Provider>
	{
		/// <summary>
		/// Get a list of external ids that match all filters
		/// </summary>
		/// <param name="where">A predicate to add arbitrary filter</param>
		/// <param name="sort">Sort information (sort order & sort by)</param>
		/// <param name="limit">Pagination information (where to start and how many to get)</param>
		/// <typeparam name="T">The type of metadata to retrieve</typeparam>
		/// <returns>A filtered list of external ids.</returns>
		Task<ICollection<MetadataID<T>>> GetMetadataID<T>(Expression<Func<MetadataID<T>, bool>> where = null, 
			Sort<MetadataID<T>> sort = default,
			Pagination limit = default)
			where T : class, IResource;

		/// <summary>
		/// Get a list of external ids that match all filters
		/// </summary>
		/// <param name="where">A predicate to add arbitrary filter</param>
		/// <param name="sort">A sort by expression</param>
		/// <param name="limit">Pagination information (where to start and how many to get)</param>
		/// <returns>A filtered list of external ids.</returns>
		Task<ICollection<MetadataID<T>>> GetMetadataID<T>([Optional] Expression<Func<MetadataID<T>, bool>> where,
			Expression<Func<MetadataID<T>, object>> sort,
			Pagination limit = default
		) where T : class, IResource
			=> GetMetadataID(where, new Sort<MetadataID<T>>(sort), limit);
	}
	
	/// <summary>
	/// A repository to handle users.
	/// </summary>
	public interface IUserRepository : IRepository<User> {}
}
