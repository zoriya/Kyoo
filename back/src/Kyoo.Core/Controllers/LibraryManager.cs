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
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Exceptions;
using Kyoo.Utils;

namespace Kyoo.Core.Controllers
{
	/// <summary>
	/// An class to interact with the database. Every repository is mapped through here.
	/// </summary>
	public class LibraryManager : ILibraryManager
	{
		/// <summary>
		/// The list of repositories
		/// </summary>
		private readonly IBaseRepository[] _repositories;

		/// <inheritdoc />
		public ILibraryRepository LibraryRepository { get; }

		/// <inheritdoc />
		public ILibraryItemRepository LibraryItemRepository { get; }

		/// <inheritdoc />
		public ICollectionRepository CollectionRepository { get; }

		/// <inheritdoc />
		public IShowRepository ShowRepository { get; }

		/// <inheritdoc />
		public ISeasonRepository SeasonRepository { get; }

		/// <inheritdoc />
		public IEpisodeRepository EpisodeRepository { get; }

		/// <inheritdoc />
		public IPeopleRepository PeopleRepository { get; }

		/// <inheritdoc />
		public IStudioRepository StudioRepository { get; }

		/// <inheritdoc />
		public IGenreRepository GenreRepository { get; }

		/// <inheritdoc />
		public IProviderRepository ProviderRepository { get; }

		/// <inheritdoc />
		public IUserRepository UserRepository { get; }

		/// <summary>
		/// Create a new <see cref="LibraryManager"/> instance with every repository available.
		/// </summary>
		/// <param name="repositories">The list of repositories that this library manager should manage.
		/// If a repository for every base type is not available, this instance won't be stable.</param>
		public LibraryManager(IEnumerable<IBaseRepository> repositories)
		{
			_repositories = repositories.ToArray();
			LibraryRepository = GetRepository<Library>() as ILibraryRepository;
			LibraryItemRepository = GetRepository<LibraryItem>() as ILibraryItemRepository;
			CollectionRepository = GetRepository<Collection>() as ICollectionRepository;
			ShowRepository = GetRepository<Show>() as IShowRepository;
			SeasonRepository = GetRepository<Season>() as ISeasonRepository;
			EpisodeRepository = GetRepository<Episode>() as IEpisodeRepository;
			PeopleRepository = GetRepository<People>() as IPeopleRepository;
			StudioRepository = GetRepository<Studio>() as IStudioRepository;
			GenreRepository = GetRepository<Genre>() as IGenreRepository;
			ProviderRepository = GetRepository<Provider>() as IProviderRepository;
			UserRepository = GetRepository<User>() as IUserRepository;
		}

		/// <inheritdoc />
		public IRepository<T> GetRepository<T>()
			where T : class, IResource
		{
			if (_repositories.FirstOrDefault(x => x.RepositoryType == typeof(T)) is IRepository<T> ret)
				return ret;
			throw new ItemNotFoundException($"No repository found for the type {typeof(T).Name}.");
		}

		/// <inheritdoc />
		public Task<T> Get<T>(int id)
			where T : class, IResource
		{
			return GetRepository<T>().Get(id);
		}

		/// <inheritdoc />
		public Task<T> Get<T>(string slug)
			where T : class, IResource
		{
			return GetRepository<T>().Get(slug);
		}

		/// <inheritdoc />
		public Task<T> Get<T>(Expression<Func<T, bool>> where)
			where T : class, IResource
		{
			return GetRepository<T>().Get(where);
		}

		/// <inheritdoc />
		public Task<Season> Get(int showID, int seasonNumber)
		{
			return SeasonRepository.Get(showID, seasonNumber);
		}

		/// <inheritdoc />
		public Task<Season> Get(string showSlug, int seasonNumber)
		{
			return SeasonRepository.Get(showSlug, seasonNumber);
		}

		/// <inheritdoc />
		public Task<Episode> Get(int showID, int seasonNumber, int episodeNumber)
		{
			return EpisodeRepository.Get(showID, seasonNumber, episodeNumber);
		}

		/// <inheritdoc />
		public Task<Episode> Get(string showSlug, int seasonNumber, int episodeNumber)
		{
			return EpisodeRepository.Get(showSlug, seasonNumber, episodeNumber);
		}

		/// <inheritdoc />
		public async Task<T> GetOrDefault<T>(int id)
			where T : class, IResource
		{
			return await GetRepository<T>().GetOrDefault(id);
		}

		/// <inheritdoc />
		public async Task<T> GetOrDefault<T>(string slug)
			where T : class, IResource
		{
			return await GetRepository<T>().GetOrDefault(slug);
		}

		/// <inheritdoc />
		public async Task<T> GetOrDefault<T>(Expression<Func<T, bool>> where, Sort<T> sortBy)
			where T : class, IResource
		{
			return await GetRepository<T>().GetOrDefault(where, sortBy);
		}

		/// <inheritdoc />
		public async Task<Season> GetOrDefault(int showID, int seasonNumber)
		{
			return await SeasonRepository.GetOrDefault(showID, seasonNumber);
		}

		/// <inheritdoc />
		public async Task<Season> GetOrDefault(string showSlug, int seasonNumber)
		{
			return await SeasonRepository.GetOrDefault(showSlug, seasonNumber);
		}

		/// <inheritdoc />
		public async Task<Episode> GetOrDefault(int showID, int seasonNumber, int episodeNumber)
		{
			return await EpisodeRepository.GetOrDefault(showID, seasonNumber, episodeNumber);
		}

		/// <inheritdoc />
		public async Task<Episode> GetOrDefault(string showSlug, int seasonNumber, int episodeNumber)
		{
			return await EpisodeRepository.GetOrDefault(showSlug, seasonNumber, episodeNumber);
		}

		/// <summary>
		/// Set relations between to objects.
		/// </summary>
		/// <param name="obj">The owner object</param>
		/// <param name="loader">A Task to load a collection of related objects</param>
		/// <param name="setter">A setter function to store the collection of related objects</param>
		/// <param name="inverse">A setter function to store the owner of a releated object loaded</param>
		/// <typeparam name="T1">The type of the owner object</typeparam>
		/// <typeparam name="T2">The type of the related object</typeparam>
		private static async Task _SetRelation<T1, T2>(T1 obj,
			Task<ICollection<T2>> loader,
			Action<T1, ICollection<T2>> setter,
			Action<T2, T1> inverse)
		{
			ICollection<T2> loaded = await loader;
			setter(obj, loaded);
			foreach (T2 item in loaded)
				inverse(item, obj);
		}

		/// <inheritdoc />
		public Task<T> Load<T, T2>(T obj, Expression<Func<T, T2>> member, bool force = false)
			where T : class, IResource
			where T2 : class, IResource
		{
			if (member == null)
				throw new ArgumentNullException(nameof(member));
			return Load(obj, Utility.GetPropertyName(member), force);
		}

		/// <inheritdoc />
		public Task<T> Load<T, T2>(T obj, Expression<Func<T, ICollection<T2>>> member, bool force = false)
			where T : class, IResource
			where T2 : class
		{
			if (member == null)
				throw new ArgumentNullException(nameof(member));
			return Load(obj, Utility.GetPropertyName(member), force);
		}

		/// <inheritdoc />
		public async Task<T> Load<T>(T obj, string memberName, bool force = false)
			where T : class, IResource
		{
			await Load(obj as IResource, memberName, force);
			return obj;
		}

		/// <inheritdoc />
		[SuppressMessage("StyleCop.CSharp.LayoutRules", "SA1507:CodeMustNotContainMultipleBlankLinesInARow",
			Justification = "Separate the code by semantics and simplify the code read.")]
		[SuppressMessage("StyleCop.CSharp.ReadabilityRules", "SA1107:Code should not contain multiple statements on one line",
			Justification = "Assing IDs and Values in the same line.")]
		public Task Load(IResource obj, string memberName, bool force = false)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			object existingValue = obj.GetType()
				.GetProperties()
				.FirstOrDefault(x => string.Equals(x.Name, memberName, StringComparison.InvariantCultureIgnoreCase))
				?.GetValue(obj);
			if (existingValue != null && !force)
				return Task.CompletedTask;

			return (obj, member: memberName) switch
			{
				(Library l, nameof(Library.Providers)) => ProviderRepository
					.GetAll(x => x.Libraries.Any(y => y.ID == obj.ID))
					.Then(x => l.Providers = x),

				(Library l, nameof(Library.Shows)) => ShowRepository
					.GetAll(x => x.Libraries.Any(y => y.ID == obj.ID))
					.Then(x => l.Shows = x),

				(Library l, nameof(Library.Collections)) => CollectionRepository
					.GetAll(x => x.Libraries.Any(y => y.ID == obj.ID))
					.Then(x => l.Collections = x),


				(Collection c, nameof(Collection.ExternalIDs)) => _SetRelation(c,
					ProviderRepository.GetMetadataID<Collection>(x => x.ResourceID == obj.ID),
					(x, y) => x.ExternalIDs = y,
					(x, y) => { x.ResourceID = y.ID; }),

				(Collection c, nameof(Collection.Shows)) => ShowRepository
					.GetAll(x => x.Collections.Any(y => y.ID == obj.ID))
					.Then(x => c.Shows = x),

				(Collection c, nameof(Collection.Libraries)) => LibraryRepository
					.GetAll(x => x.Collections.Any(y => y.ID == obj.ID))
					.Then(x => c.Libraries = x),


				(Show s, nameof(Show.ExternalIDs)) => _SetRelation(s,
					ProviderRepository.GetMetadataID<Show>(x => x.ResourceID == obj.ID),
					(x, y) => x.ExternalIDs = y,
					(x, y) => { x.ResourceID = y.ID; }),

				(Show s, nameof(Show.Genres)) => GenreRepository
					.GetAll(x => x.Shows.Any(y => y.ID == obj.ID))
					.Then(x => s.Genres = x),

				(Show s, nameof(Show.People)) => PeopleRepository
					.GetFromShow(obj.ID)
					.Then(x => s.People = x),

				(Show s, nameof(Show.Seasons)) => _SetRelation(s,
					SeasonRepository.GetAll(x => x.Show.ID == obj.ID),
					(x, y) => x.Seasons = y,
					(x, y) => { x.Show = y; x.ShowID = y.ID; }),

				(Show s, nameof(Show.Episodes)) => _SetRelation(s,
					EpisodeRepository.GetAll(x => x.Show.ID == obj.ID),
					(x, y) => x.Episodes = y,
					(x, y) => { x.Show = y; x.ShowID = y.ID; }),

				(Show s, nameof(Show.Libraries)) => LibraryRepository
					.GetAll(x => x.Shows.Any(y => y.ID == obj.ID))
					.Then(x => s.Libraries = x),

				(Show s, nameof(Show.Collections)) => CollectionRepository
					.GetAll(x => x.Shows.Any(y => y.ID == obj.ID))
					.Then(x => s.Collections = x),

				(Show s, nameof(Show.Studio)) => StudioRepository
					.GetOrDefault(x => x.Shows.Any(y => y.ID == obj.ID))
					.Then(x =>
					{
						s.Studio = x;
						s.StudioID = x?.ID ?? 0;
					}),


				(Season s, nameof(Season.ExternalIDs)) => _SetRelation(s,
					ProviderRepository.GetMetadataID<Season>(x => x.ResourceID == obj.ID),
					(x, y) => x.ExternalIDs = y,
					(x, y) => { x.ResourceID = y.ID; }),

				(Season s, nameof(Season.Episodes)) => _SetRelation(s,
					EpisodeRepository.GetAll(x => x.Season.ID == obj.ID),
					(x, y) => x.Episodes = y,
					(x, y) => { x.Season = y; x.SeasonID = y.ID; }),

				(Season s, nameof(Season.Show)) => ShowRepository
					.GetOrDefault(x => x.Seasons.Any(y => y.ID == obj.ID))
					.Then(x =>
					{
						s.Show = x;
						s.ShowID = x?.ID ?? 0;
					}),


				(Episode e, nameof(Episode.ExternalIDs)) => _SetRelation(e,
					ProviderRepository.GetMetadataID<Episode>(x => x.ResourceID == obj.ID),
					(x, y) => x.ExternalIDs = y,
					(x, y) => { x.ResourceID = y.ID; }),

				(Episode e, nameof(Episode.Show)) => ShowRepository
					.GetOrDefault(x => x.Episodes.Any(y => y.ID == obj.ID))
					.Then(x =>
					{
						e.Show = x;
						e.ShowID = x?.ID ?? 0;
					}),

				(Episode e, nameof(Episode.Season)) => SeasonRepository
					.GetOrDefault(x => x.Episodes.Any(y => y.ID == e.ID))
					.Then(x =>
					{
						e.Season = x;
						e.SeasonID = x?.ID ?? 0;
					}),


				(Genre g, nameof(Genre.Shows)) => ShowRepository
					.GetAll(x => x.Genres.Any(y => y.ID == obj.ID))
					.Then(x => g.Shows = x),


				(Studio s, nameof(Studio.Shows)) => ShowRepository
					.GetAll(x => x.Studio.ID == obj.ID)
					.Then(x => s.Shows = x),

				(Studio s, nameof(Studio.ExternalIDs)) => _SetRelation(s,
					ProviderRepository.GetMetadataID<Studio>(x => x.ResourceID == obj.ID),
					(x, y) => x.ExternalIDs = y,
					(x, y) => { x.ResourceID = y.ID; }),


				(People p, nameof(People.ExternalIDs)) => _SetRelation(p,
					ProviderRepository.GetMetadataID<People>(x => x.ResourceID == obj.ID),
					(x, y) => x.ExternalIDs = y,
					(x, y) => { x.ResourceID = y.ID; }),

				(People p, nameof(People.Roles)) => PeopleRepository
					.GetFromPeople(obj.ID)
					.Then(x => p.Roles = x),


				(Provider p, nameof(Provider.Libraries)) => LibraryRepository
					.GetAll(x => x.Providers.Any(y => y.ID == obj.ID))
					.Then(x => p.Libraries = x),


				_ => throw new ArgumentException($"Couldn't find a way to load {memberName} of {obj.Slug}.")
			};
		}

		/// <inheritdoc />
		public Task<ICollection<LibraryItem>> GetItemsFromLibrary(int id,
			Expression<Func<LibraryItem, bool>> where = null,
			Sort<LibraryItem> sort = default,
			Pagination limit = default)
		{
			return LibraryItemRepository.GetFromLibrary(id, where, sort, limit);
		}

		/// <inheritdoc />
		public Task<ICollection<LibraryItem>> GetItemsFromLibrary(string slug,
			Expression<Func<LibraryItem, bool>> where = null,
			Sort<LibraryItem> sort = default,
			Pagination limit = default)
		{
			return LibraryItemRepository.GetFromLibrary(slug, where, sort, limit);
		}

		/// <inheritdoc />
		public Task<ICollection<PeopleRole>> GetPeopleFromShow(int showID,
			Expression<Func<PeopleRole, bool>> where = null,
			Sort<PeopleRole> sort = default,
			Pagination limit = default)
		{
			return PeopleRepository.GetFromShow(showID, where, sort, limit);
		}

		/// <inheritdoc />
		public Task<ICollection<PeopleRole>> GetPeopleFromShow(string showSlug,
			Expression<Func<PeopleRole, bool>> where = null,
			Sort<PeopleRole> sort = default,
			Pagination limit = default)
		{
			return PeopleRepository.GetFromShow(showSlug, where, sort, limit);
		}

		/// <inheritdoc />
		public Task<ICollection<PeopleRole>> GetRolesFromPeople(int id,
			Expression<Func<PeopleRole, bool>> where = null,
			Sort<PeopleRole> sort = default,
			Pagination limit = default)
		{
			return PeopleRepository.GetFromPeople(id, where, sort, limit);
		}

		/// <inheritdoc />
		public Task<ICollection<PeopleRole>> GetRolesFromPeople(string slug,
			Expression<Func<PeopleRole, bool>> where = null,
			Sort<PeopleRole> sort = default,
			Pagination limit = default)
		{
			return PeopleRepository.GetFromPeople(slug, where, sort, limit);
		}

		/// <inheritdoc />
		public Task AddShowLink(int showID, int? libraryID, int? collectionID)
		{
			return ShowRepository.AddShowLink(showID, libraryID, collectionID);
		}

		/// <inheritdoc />
		public Task AddShowLink(Show show, Library library, Collection collection)
		{
			if (show == null)
				throw new ArgumentNullException(nameof(show));
			return ShowRepository.AddShowLink(show.ID, library?.ID, collection?.ID);
		}

		/// <inheritdoc />
		public Task<ICollection<T>> GetAll<T>(Expression<Func<T, bool>> where = null,
			Sort<T> sort = default,
			Pagination limit = default)
			where T : class, IResource
		{
			return GetRepository<T>().GetAll(where, sort, limit);
		}

		/// <inheritdoc />
		public Task<int> GetCount<T>(Expression<Func<T, bool>> where = null)
			where T : class, IResource
		{
			return GetRepository<T>().GetCount(where);
		}

		/// <inheritdoc />
		public Task<ICollection<T>> Search<T>(string query)
			where T : class, IResource
		{
			return GetRepository<T>().Search(query);
		}

		/// <inheritdoc />
		public Task<T> Create<T>(T item)
			where T : class, IResource
		{
			return GetRepository<T>().Create(item);
		}

		/// <inheritdoc />
		public Task<T> CreateIfNotExists<T>(T item)
			where T : class, IResource
		{
			return GetRepository<T>().CreateIfNotExists(item);
		}

		/// <inheritdoc />
		public Task<T> Edit<T>(T item, bool resetOld)
			where T : class, IResource
		{
			return GetRepository<T>().Edit(item, resetOld);
		}

		/// <inheritdoc />
		public Task Delete<T>(T item)
			where T : class, IResource
		{
			return GetRepository<T>().Delete(item);
		}

		/// <inheritdoc />
		public Task Delete<T>(int id)
			where T : class, IResource
		{
			return GetRepository<T>().Delete(id);
		}

		/// <inheritdoc />
		public Task Delete<T>(string slug)
			where T : class, IResource
		{
			return GetRepository<T>().Delete(slug);
		}
	}
}
