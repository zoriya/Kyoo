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
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Exceptions;

namespace Kyoo.Abstractions.Controllers
{
	/// <summary>
	/// A common repository for every resources.
	/// </summary>
	/// <typeparam name="T">The resource's type that this repository manage.</typeparam>
	public interface IRepository<T> : IBaseRepository
		where T : class, IResource
	{
		/// <summary>
		/// The event handler type for all events of this repository.
		/// </summary>
		/// <param name="resource">The resource created/modified/deleted</param>
		public delegate void ResourceEventHandler(T resource);

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
		Task<T?> GetOrDefault(int id);

		/// <summary>
		/// Get a resource from it's slug or null if it is not found.
		/// </summary>
		/// <param name="slug">The slug of the resource</param>
		/// <returns>The resource found</returns>
		Task<T?> GetOrDefault(string slug);

		/// <summary>
		/// Get the first resource that match the predicate or null if it is not found.
		/// </summary>
		/// <param name="where">A predicate to filter the resource.</param>
		/// <param name="sortBy">A custom sort method to handle cases where multiples items match the filters.</param>
		/// <returns>The resource found</returns>
		Task<T?> GetOrDefault(Expression<Func<T, bool>> where, Sort<T>? sortBy = default);

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
		Task<ICollection<T>> GetAll(Expression<Func<T, bool>>? where = null,
			Sort<T>? sort = default,
			Pagination? limit = default);

		/// <summary>
		/// Get the number of resources that match the filter's predicate.
		/// </summary>
		/// <param name="where">A filter predicate</param>
		/// <returns>How many resources matched that filter</returns>
		Task<int> GetCount(Expression<Func<T, bool>>? where = null);

		/// <summary>
		/// Create a new resource.
		/// </summary>
		/// <param name="obj">The item to register</param>
		/// <returns>The resource registers and completed by database's information (related items and so on)</returns>
		Task<T> Create(T obj);

		/// <summary>
		/// Create a new resource if it does not exist already. If it does, the existing value is returned instead.
		/// </summary>
		/// <param name="obj">The object to create</param>
		/// <returns>The newly created item or the existing value if it existed.</returns>
		Task<T> CreateIfNotExists(T obj);

		/// <summary>
		/// Called when a resource has been created.
		/// </summary>
		event ResourceEventHandler OnCreated;

		/// <summary>
		/// Edit a resource and replace every property
		/// </summary>
		/// <param name="edited">The resource to edit, it's ID can't change.</param>
		/// <exception cref="ItemNotFoundException">If the item is not found</exception>
		/// <returns>The resource edited and completed by database's information (related items and so on)</returns>
		Task<T> Edit(T edited);

		/// <summary>
		/// Edit only specific properties of a resource
		/// </summary>
		/// <param name="id">The id of the resource to edit</param>
		/// <param name="patch">
		/// A method that will be called when you need to update every properties that you want to
		/// persist. It can return false to abort the process via an ArgumentException
		/// </param>
		/// <exception cref="ItemNotFoundException">If the item is not found</exception>
		/// <returns>The resource edited and completed by database's information (related items and so on)</returns>
		Task<T> Patch(int id, Func<T, Task<bool>> patch);

		/// <summary>
		/// Called when a resource has been edited.
		/// </summary>
		event ResourceEventHandler OnEdited;

		/// <summary>
		/// Delete a resource by it's ID
		/// </summary>
		/// <param name="id">The ID of the resource</param>
		/// <exception cref="ItemNotFoundException">If the item is not found</exception>
		/// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
		Task Delete(int id);

		/// <summary>
		/// Delete a resource by it's slug
		/// </summary>
		/// <param name="slug">The slug of the resource</param>
		/// <exception cref="ItemNotFoundException">If the item is not found</exception>
		/// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
		Task Delete(string slug);

		/// <summary>
		/// Delete a resource
		/// </summary>
		/// <param name="obj">The resource to delete</param>
		/// <exception cref="ItemNotFoundException">If the item is not found</exception>
		/// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
		Task Delete(T obj);

		/// <summary>
		/// Delete all resources that match the predicate.
		/// </summary>
		/// <param name="where">A predicate to filter resources to delete. Every resource that match this will be deleted.</param>
		/// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
		Task DeleteAll(Expression<Func<T, bool>> where);

		/// <summary>
		/// Called when a resource has been edited.
		/// </summary>
		event ResourceEventHandler OnDeleted;
	}

	/// <summary>
	/// A base class for repositories. Every service implementing this will be handled by the <see cref="ILibraryManager"/>.
	/// </summary>
	public interface IBaseRepository
	{
		/// <summary>
		/// The type for witch this repository is responsible or null if non applicable.
		/// </summary>
		Type RepositoryType { get; }
	}

	/// <summary>
	/// A repository to handle shows.
	/// </summary>
	public interface IMovieRepository : IRepository<Movie> { }

	/// <summary>
	/// A repository to handle shows.
	/// </summary>
	public interface IShowRepository : IRepository<Show>
	{
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
		// TODO replace the next methods with extension methods.

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
	/// A repository to handle library items (A wrapper around shows and collections).
	/// </summary>
	public interface ILibraryItemRepository : IRepository<ILibraryItem> { }

	/// <summary>
	/// A repository for collections
	/// </summary>
	public interface ICollectionRepository : IRepository<Collection> { }

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
		/// <param name="sort">Sort information (sort order and sort by)</param>
		/// <param name="limit">How many items to return and where to start</param>
		/// <exception cref="ItemNotFoundException">No <see cref="Show"/> exist with the given ID.</exception>
		/// <returns>A list of items that match every filters</returns>
		Task<ICollection<PeopleRole>> GetFromShow(int showID,
			Expression<Func<PeopleRole, bool>>? where = null,
			Sort<PeopleRole>? sort = default,
			Pagination? limit = default);

		/// <summary>
		/// Get people's roles from a show.
		/// </summary>
		/// <param name="showSlug">The slug of the show</param>
		/// <param name="where">A filter function</param>
		/// <param name="sort">Sort information (sort order and sort by)</param>
		/// <param name="limit">How many items to return and where to start</param>
		/// <exception cref="ItemNotFoundException">No <see cref="Show"/> exist with the given slug.</exception>
		/// <returns>A list of items that match every filters</returns>
		Task<ICollection<PeopleRole>> GetFromShow(string showSlug,
			Expression<Func<PeopleRole, bool>>? where = null,
			Sort<PeopleRole>? sort = default,
			Pagination? limit = default);

		/// <summary>
		/// Get people's roles from a person.
		/// </summary>
		/// <param name="id">The id of the person</param>
		/// <param name="where">A filter function</param>
		/// <param name="sort">Sort information (sort order and sort by)</param>
		/// <param name="limit">How many items to return and where to start</param>
		/// <exception cref="ItemNotFoundException">No <see cref="People"/> exist with the given ID.</exception>
		/// <returns>A list of items that match every filters</returns>
		Task<ICollection<PeopleRole>> GetFromPeople(int id,
			Expression<Func<PeopleRole, bool>>? where = null,
			Sort<PeopleRole>? sort = default,
			Pagination? limit = default);

		/// <summary>
		/// Get people's roles from a person.
		/// </summary>
		/// <param name="slug">The slug of the person</param>
		/// <param name="where">A filter function</param>
		/// <param name="sort">Sort information (sort order and sort by)</param>
		/// <param name="limit">How many items to return and where to start</param>
		/// <exception cref="ItemNotFoundException">No <see cref="People"/> exist with the given slug.</exception>
		/// <returns>A list of items that match every filters</returns>
		Task<ICollection<PeopleRole>> GetFromPeople(string slug,
			Expression<Func<PeopleRole, bool>>? where = null,
			Sort<PeopleRole>? sort = default,
			Pagination? limit = default);
	}

	/// <summary>
	/// A repository to handle users.
	/// </summary>
	public interface IUserRepository : IRepository<User> { }
}
