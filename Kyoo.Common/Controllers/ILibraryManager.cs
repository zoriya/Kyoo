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
	/// An interface to interract with the database. Every repository is mapped through here. 
	/// </summary>
	public interface ILibraryManager
	{
		/// <summary>
		/// Get the repository corresponding to the T item.
		/// </summary>
		/// <typeparam name="T">The type you want</typeparam>
		/// <exception cref="ItemNotFoundException">If the item is not found</exception>
		/// <returns>The repository corresponding</returns>
		IRepository<T> GetRepository<T>() where T : class, IResource;

		/// <summary>
		/// The repository that handle libraries.
		/// </summary>
		ILibraryRepository LibraryRepository { get; }
		
		/// <summary>
		/// The repository that handle libraries's items (a wrapper arround shows & collections).
		/// </summary>
		ILibraryItemRepository LibraryItemRepository { get; }
		
		/// <summary>
		/// The repository that handle collections.
		/// </summary>
		ICollectionRepository CollectionRepository { get; }
		
		/// <summary>
		/// The repository that handle shows.
		/// </summary>
		IShowRepository ShowRepository { get; }
		
		/// <summary>
		/// The repository that handle seasons.
		/// </summary>
		ISeasonRepository SeasonRepository { get; }
		
		/// <summary>
		/// The repository that handle episodes.
		/// </summary>
		IEpisodeRepository EpisodeRepository { get; }
		
		/// <summary>
		/// The repository that handle tracks.
		/// </summary>
		ITrackRepository TrackRepository { get; }
		
		/// <summary>
		/// The repository that handle people.
		/// </summary>
		IPeopleRepository PeopleRepository { get; }
		
		/// <summary>
		/// The repository that handle studios.
		/// </summary>
		IStudioRepository StudioRepository { get; }
		
		/// <summary>
		/// The repository that handle genres.
		/// </summary>
		IGenreRepository GenreRepository { get; }
		
		/// <summary>
		/// The repository that handle providers.
		/// </summary>
		IProviderRepository ProviderRepository { get; }
		
		/// <summary>
		/// Get the resource by it's ID
		/// </summary>
		/// <param name="id">The id of the resource</param>
		/// <typeparam name="T">The type of the resource</typeparam>
		/// <exception cref="ItemNotFoundException">If the item is not found</exception>
		/// <returns>The resource found</returns>
		[ItemNotNull]
		Task<T> Get<T>(int id) where T : class, IResource;
		
		/// <summary>
		/// Get the resource by it's slug
		/// </summary>
		/// <param name="slug">The slug of the resource</param>
		/// <typeparam name="T">The type of the resource</typeparam>
		/// <exception cref="ItemNotFoundException">If the item is not found</exception>
		/// <returns>The resource found</returns>
		[ItemNotNull]
		Task<T> Get<T>(string slug) where T : class, IResource;
		
		/// <summary>
		/// Get the resource by a filter function.
		/// </summary>
		/// <param name="where">The filter function.</param>
		/// <typeparam name="T">The type of the resource</typeparam>
		/// <exception cref="ItemNotFoundException">If the item is not found</exception>
		/// <returns>The first resource found that match the where function</returns>
		[ItemNotNull]
		Task<T> Get<T>(Expression<Func<T, bool>> where) where T : class, IResource;

		/// <summary>
		/// Get a season from it's showID and it's seasonNumber
		/// </summary>
		/// <param name="showID">The id of the show</param>
		/// <param name="seasonNumber">The season's number</param>
		/// <exception cref="ItemNotFoundException">If the item is not found</exception>
		/// <returns>The season found</returns>
		[ItemNotNull]
		Task<Season> Get(int showID, int seasonNumber);
		
		/// <summary>
		/// Get a season from it's show slug and it's seasonNumber
		/// </summary>
		/// <param name="showSlug">The slug of the show</param>
		/// <param name="seasonNumber">The season's number</param>
		/// <exception cref="ItemNotFoundException">If the item is not found</exception>
		/// <returns>The season found</returns>
		[ItemNotNull]
		Task<Season> Get(string showSlug, int seasonNumber);
		
		/// <summary>
		/// Get a episode from it's showID, it's seasonNumber and it's episode number.
		/// </summary>
		/// <param name="showID">The id of the show</param>
		/// <param name="seasonNumber">The season's number</param>
		/// <param name="episodeNumber">The episode's number</param>
		/// <exception cref="ItemNotFoundException">If the item is not found</exception>
		/// <returns>The episode found</returns>
		[ItemNotNull]
		Task<Episode> Get(int showID, int seasonNumber, int episodeNumber);
		
		/// <summary>
		/// Get a episode from it's show slug, it's seasonNumber and it's episode number.
		/// </summary>
		/// <param name="showSlug">The slug of the show</param>
		/// <param name="seasonNumber">The season's number</param>
		/// <param name="episodeNumber">The episode's number</param>
		/// <exception cref="ItemNotFoundException">If the item is not found</exception>
		/// <returns>The episode found</returns>
		[ItemNotNull]
		Task<Episode> Get(string showSlug, int seasonNumber, int episodeNumber);

		/// <summary>
		/// Get the resource by it's ID or null if it is not found.
		/// </summary>
		/// <param name="id">The id of the resource</param>
		/// <typeparam name="T">The type of the resource</typeparam>
		/// <returns>The resource found</returns>
		[ItemCanBeNull]
		Task<T> GetOrDefault<T>(int id) where T : class, IResource;
		
		/// <summary>
		/// Get the resource by it's slug or null if it is not found.
		/// </summary>
		/// <param name="slug">The slug of the resource</param>
		/// <typeparam name="T">The type of the resource</typeparam>
		/// <returns>The resource found</returns>
		[ItemCanBeNull]
		Task<T> GetOrDefault<T>(string slug) where T : class, IResource;
		
		/// <summary>
		/// Get the resource by a filter function or null if it is not found.
		/// </summary>
		/// <param name="where">The filter function.</param>
		/// <typeparam name="T">The type of the resource</typeparam>
		/// <returns>The first resource found that match the where function</returns>
		[ItemCanBeNull]
		Task<T> GetOrDefault<T>(Expression<Func<T, bool>> where) where T : class, IResource;

		/// <summary>
		/// Get a season from it's showID and it's seasonNumber or null if it is not found.
		/// </summary>
		/// <param name="showID">The id of the show</param>
		/// <param name="seasonNumber">The season's number</param>
		/// <returns>The season found</returns>
		[ItemCanBeNull]
		Task<Season> GetOrDefault(int showID, int seasonNumber);
		
		/// <summary>
		/// Get a season from it's show slug and it's seasonNumber or null if it is not found.
		/// </summary>
		/// <param name="showSlug">The slug of the show</param>
		/// <param name="seasonNumber">The season's number</param>
		/// <returns>The season found</returns>
		[ItemCanBeNull]
		Task<Season> GetOrDefault(string showSlug, int seasonNumber);
		
		/// <summary>
		/// Get a episode from it's showID, it's seasonNumber and it's episode number or null if it is not found.
		/// </summary>
		/// <param name="showID">The id of the show</param>
		/// <param name="seasonNumber">The season's number</param>
		/// <param name="episodeNumber">The episode's number</param>
		/// <returns>The episode found</returns>
		[ItemCanBeNull]
		Task<Episode> GetOrDefault(int showID, int seasonNumber, int episodeNumber);
		
		/// <summary>
		/// Get a episode from it's show slug, it's seasonNumber and it's episode number or null if it is not found.
		/// </summary>
		/// <param name="showSlug">The slug of the show</param>
		/// <param name="seasonNumber">The season's number</param>
		/// <param name="episodeNumber">The episode's number</param>
		/// <returns>The episode found</returns>
		[ItemCanBeNull]
		Task<Episode> GetOrDefault(string showSlug, int seasonNumber, int episodeNumber);


		/// <summary>
		/// Load a related resource
		/// </summary>
		/// <param name="obj">The source object.</param>
		/// <param name="member">A getter function for the member to load</param>
		/// <typeparam name="T">The type of the source object</typeparam>
		/// <typeparam name="T2">The related resource's type</typeparam>
		/// <returns>The param <see cref="obj"/></returns>
		/// <seealso cref="Load{T,T2}(T,System.Linq.Expressions.Expression{System.Func{T,System.Collections.Generic.ICollection{T2}}})"/>
		/// <seealso cref="Load{T}(T, System.String)"/>
		/// <seealso cref="Load(IResource, string)"/>
		Task<T> Load<T, T2>([NotNull] T obj, Expression<Func<T, T2>> member)
			where T : class, IResource
			where T2 : class, IResource, new();

		/// <summary>
		/// Load a collection of related resource
		/// </summary>
		/// <param name="obj">The source object.</param>
		/// <param name="member">A getter function for the member to load</param>
		/// <typeparam name="T">The type of the source object</typeparam>
		/// <typeparam name="T2">The related resource's type</typeparam>
		/// <returns>The param <see cref="obj"/></returns>
		/// <seealso cref="Load{T,T2}(T,System.Linq.Expressions.Expression{System.Func{T,T2}})"/>
		/// <seealso cref="Load{T}(T, System.String)"/>
		/// <seealso cref="Load(IResource, string)"/>
		Task<T> Load<T, T2>([NotNull] T obj, Expression<Func<T, ICollection<T2>>> member)
			where T : class, IResource
			where T2 : class, new();

		/// <summary>
		/// Load a related resource by it's name
		/// </summary>
		/// <param name="obj">The source object.</param>
		/// <param name="memberName">The name of the resource to load (case sensitive)</param>
		/// <typeparam name="T">The type of the source object</typeparam>
		/// <returns>The param <see cref="obj"/></returns>
		/// <seealso cref="Load{T,T2}(T,System.Linq.Expressions.Expression{System.Func{T,T2}})"/>
		/// <seealso cref="Load{T,T2}(T,System.Linq.Expressions.Expression{System.Func{T,System.Collections.Generic.ICollection{T2}}})"/>
		/// <seealso cref="Load(IResource, string)"/>
		Task<T> Load<T>([NotNull] T obj, string memberName)
			where T : class, IResource;

		/// <summary>
		/// Load a related resource without specifing it's type.
		/// </summary>
		/// <param name="obj">The source object.</param>
		/// <param name="memberName">The name of the resource to load (case sensitive)</param>
		/// <seealso cref="Load{T,T2}(T,System.Linq.Expressions.Expression{System.Func{T,T2}})"/>
		/// <seealso cref="Load{T,T2}(T,System.Linq.Expressions.Expression{System.Func{T,System.Collections.Generic.ICollection{T2}}})"/>
		/// <seealso cref="Load{T}(T, System.String)"/>
		Task Load([NotNull] IResource obj, string memberName);
		
		/// <summary>
		/// Get items (A wrapper arround shows or collections) from a library.
		/// </summary>
		/// <param name="id">The ID of the library</param>
		/// <param name="where">A filter function</param>
		/// <param name="sort">Sort informations (sort order & sort by)</param>
		/// <param name="limit">How many items to return and where to start</param>
		/// <returns>A list of items that match every filters</returns>
		Task<ICollection<LibraryItem>> GetItemsFromLibrary(int id,
			Expression<Func<LibraryItem, bool>> where = null,
			Sort<LibraryItem> sort = default,
			Pagination limit = default);
		
		/// <summary>
		/// Get items (A wrapper arround shows or collections) from a library.
		/// </summary>
		/// <param name="id">The ID of the library</param>
		/// <param name="where">A filter function</param>
		/// <param name="sort">A sort by method</param>
		/// <param name="limit">How many items to return and where to start</param>
		/// <returns>A list of items that match every filters</returns>
		Task<ICollection<LibraryItem>> GetItemsFromLibrary(int id,
			[Optional] Expression<Func<LibraryItem, bool>> where,
			Expression<Func<LibraryItem, object>> sort,
			Pagination limit = default
		) => GetItemsFromLibrary(id, where, new Sort<LibraryItem>(sort), limit);
		
		/// <summary>
		/// Get items (A wrapper arround shows or collections) from a library.
		/// </summary>
		/// <param name="slug">The slug of the library</param>
		/// <param name="where">A filter function</param>
		/// <param name="sort">Sort informations (sort order & sort by)</param>
		/// <param name="limit">How many items to return and where to start</param>
		/// <returns>A list of items that match every filters</returns>
		Task<ICollection<LibraryItem>> GetItemsFromLibrary(string slug,
			Expression<Func<LibraryItem, bool>> where = null,
			Sort<LibraryItem> sort = default,
			Pagination limit = default);
		
		/// <summary>
		/// Get items (A wrapper arround shows or collections) from a library.
		/// </summary>
		/// <param name="slug">The slug of the library</param>
		/// <param name="where">A filter function</param>
		/// <param name="sort">A sort by method</param>
		/// <param name="limit">How many items to return and where to start</param>
		/// <returns>A list of items that match every filters</returns>
		Task<ICollection<LibraryItem>> GetItemsFromLibrary(string slug,
			[Optional] Expression<Func<LibraryItem, bool>> where,
			Expression<Func<LibraryItem, object>> sort,
			Pagination limit = default
		) => GetItemsFromLibrary(slug, where, new Sort<LibraryItem>(sort), limit);
		
		
		/// <summary>
		/// Get people's roles from a show.
		/// </summary>
		/// <param name="showID">The ID of the show</param>
		/// <param name="where">A filter function</param>
		/// <param name="sort">Sort informations (sort order & sort by)</param>
		/// <param name="limit">How many items to return and where to start</param>
		/// <returns>A list of items that match every filters</returns>
		Task<ICollection<PeopleRole>> GetPeopleFromShow(int showID,
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
		Task<ICollection<PeopleRole>> GetPeopleFromShow(int showID,
			[Optional] Expression<Func<PeopleRole, bool>> where,
			Expression<Func<PeopleRole, object>> sort,
			Pagination limit = default
		) => GetPeopleFromShow(showID, where, new Sort<PeopleRole>(sort), limit);
		
		/// <summary>
		/// Get people's roles from a show.
		/// </summary>
		/// <param name="showSlug">The slug of the show</param>
		/// <param name="where">A filter function</param>
		/// <param name="sort">Sort informations (sort order & sort by)</param>
		/// <param name="limit">How many items to return and where to start</param>
		/// <returns>A list of items that match every filters</returns>
		Task<ICollection<PeopleRole>> GetPeopleFromShow(string showSlug,
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
		Task<ICollection<PeopleRole>> GetPeopleFromShow(string showSlug,
			[Optional] Expression<Func<PeopleRole, bool>> where,
			Expression<Func<PeopleRole, object>> sort,
			Pagination limit = default
		) => GetPeopleFromShow(showSlug, where, new Sort<PeopleRole>(sort), limit);
		
		
		/// <summary>
		/// Get people's roles from a person.
		/// </summary>
		/// <param name="id">The id of the person</param>
		/// <param name="where">A filter function</param>
		/// <param name="sort">Sort informations (sort order & sort by)</param>
		/// <param name="limit">How many items to return and where to start</param>
		/// <returns>A list of items that match every filters</returns>
		Task<ICollection<PeopleRole>> GetRolesFromPeople(int id,
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
		Task<ICollection<PeopleRole>> GetRolesFromPeople(int id,
			[Optional] Expression<Func<PeopleRole, bool>> where,
			Expression<Func<PeopleRole, object>> sort,
			Pagination limit = default
		) => GetRolesFromPeople(id, where, new Sort<PeopleRole>(sort), limit);
		
		/// <summary>
		/// Get people's roles from a person.
		/// </summary>
		/// <param name="slug">The slug of the person</param>
		/// <param name="where">A filter function</param>
		/// <param name="sort">Sort informations (sort order & sort by)</param>
		/// <param name="limit">How many items to return and where to start</param>
		/// <returns>A list of items that match every filters</returns>
		Task<ICollection<PeopleRole>> GetRolesFromPeople(string slug,
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
		Task<ICollection<PeopleRole>> GetRolesFromPeople(string slug,
			[Optional] Expression<Func<PeopleRole, bool>> where,
			Expression<Func<PeopleRole, object>> sort,
			Pagination limit = default
		) => GetRolesFromPeople(slug, where, new Sort<PeopleRole>(sort), limit);

		
		/// <summary>
		/// Setup relations between a show, a library and a collection
		/// </summary>
		/// <param name="showID">The show's ID to setup relations with</param>
		/// <param name="libraryID">The library's ID to setup relations with (optional)</param>
		/// <param name="collectionID">The collection's ID to setup relations with (optional)</param>
		Task AddShowLink(int showID, int? libraryID, int? collectionID);
		
		/// <summary>
		/// Setup relations between a show, a library and a collection
		/// </summary>
		/// <param name="show">The show to setup relations with</param>
		/// <param name="library">The library to setup relations with (optional)</param>
		/// <param name="collection">The collection to setup relations with (optional)</param>
		Task AddShowLink([NotNull] Show show, Library library, Collection collection);

		/// <summary>
		/// Get all resources with filters
		/// </summary>
		/// <param name="where">A filter function</param>
		/// <param name="sort">Sort informations (sort order & sort by)</param>
		/// <param name="limit">How many items to return and where to start</param>
		/// <typeparam name="T">The type of resources to load</typeparam>
		/// <returns>A list of resources that match every filters</returns>
		Task<ICollection<T>> GetAll<T>(Expression<Func<T, bool>> where = null,
			Sort<T> sort = default,
			Pagination limit = default) where T : class, IResource;
		
		/// <summary>
		/// Get all resources with filters
		/// </summary>
		/// <param name="where">A filter function</param>
		/// <param name="sort">A sort by function</param>
		/// <param name="limit">How many items to return and where to start</param>
		/// <typeparam name="T">The type of resources to load</typeparam>
		/// <returns>A list of resources that match every filters</returns>
		Task<ICollection<T>> GetAll<T>([Optional] Expression<Func<T, bool>> where,
			Expression<Func<T, object>> sort,
			Pagination limit = default) where T : class, IResource
		{
			return GetAll(where, new Sort<T>(sort), limit);
		}

		/// <summary>
		/// Get the count of resources that match the filter
		/// </summary>
		/// <param name="where">A filter function</param>
		/// <typeparam name="T">The type of resources to load</typeparam>
		/// <returns>A list of resources that match every filters</returns>
		Task<int> GetCount<T>(Expression<Func<T, bool>> where = null) where T : class, IResource;

		/// <summary>
		/// Search for a resource
		/// </summary>
		/// <param name="query">The search query</param>
		/// <typeparam name="T">The type of resources</typeparam>
		/// <returns>A list of 20 items that match the search query</returns>
		Task<ICollection<T>> Search<T>(string query) where T : class, IResource;

		/// <summary>
		/// Create a new resource.
		/// </summary>
		/// <param name="item">The item to register</param>
		/// <typeparam name="T">The type of resource</typeparam>
		/// <returns>The resource registers and completed by database's informations (related items & so on)</returns>
		Task<T> Create<T>([NotNull] T item) where T : class, IResource;
		
		/// <summary>
		/// Create a new resource if it does not exist already. If it does, the existing value is returned instead.
		/// </summary>
		/// <param name="item">The item to register</param>
		/// <typeparam name="T">The type of resource</typeparam>
		/// <returns>The newly created item or the existing value if it existed.</returns>
		Task<T> CreateIfNotExists<T>([NotNull] T item) where T : class, IResource;
		
		/// <summary>
		/// Edit a resource
		/// </summary>
		/// <param name="item">The resourcce to edit, it's ID can't change.</param>
		/// <param name="resetOld">Should old properties of the resource be discarded or should null values considered as not changed?</param>
		/// <typeparam name="T">The type of resources</typeparam>
		/// <exception cref="ItemNotFoundException">If the item is not found</exception>
		/// <returns>The resource edited and completed by database's informations (related items & so on)</returns>
		Task<T> Edit<T>(T item, bool resetOld) where T : class, IResource;

		/// <summary>
		/// Delete a resource.
		/// </summary>
		/// <param name="item">The resource to delete</param>
		/// <typeparam name="T">The type of resource to delete</typeparam>
		/// <exception cref="ItemNotFoundException">If the item is not found</exception>
		Task Delete<T>(T item) where T : class, IResource;
		
		/// <summary>
		/// Delete a resource by it's ID.
		/// </summary>
		/// <param name="id">The id of the resource to delete</param>
		/// <typeparam name="T">The type of resource to delete</typeparam>
		/// <exception cref="ItemNotFoundException">If the item is not found</exception>
		Task Delete<T>(int id) where T : class, IResource;
		
		/// <summary>
		/// Delete a resource by it's slug.
		/// </summary>
		/// <param name="slug">The slug of the resource to delete</param>
		/// <typeparam name="T">The type of resource to delete</typeparam>
		/// <exception cref="ItemNotFoundException">If the item is not found</exception>
		Task Delete<T>(string slug) where T : class, IResource;
	}
}
