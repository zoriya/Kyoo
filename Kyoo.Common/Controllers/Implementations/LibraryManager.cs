using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;

namespace Kyoo.Controllers
{
	public class LibraryManager : ILibraryManager
	{
		/// <summary>
		/// The list of repositories
		/// </summary>
		private readonly IBaseRepository[] _repositories;
		
		/// <summary>
		/// The repository that handle libraries.
		/// </summary>
		public ILibraryRepository LibraryRepository { get; }
		
		/// <summary>
		/// The repository that handle libraries's items (a wrapper arround shows & collections).
		/// </summary>
		public ILibraryItemRepository LibraryItemRepository { get; }
		
		/// <summary>
		/// The repository that handle collections.
		/// </summary>
		public ICollectionRepository CollectionRepository { get; }
		
		/// <summary>
		/// The repository that handle shows.
		/// </summary>
		public IShowRepository ShowRepository { get; }
		
		/// <summary>
		/// The repository that handle seasons.
		/// </summary>
		public ISeasonRepository SeasonRepository { get; }
		
		/// <summary>
		/// The repository that handle episodes.
		/// </summary>
		public IEpisodeRepository EpisodeRepository { get; }
		
		/// <summary>
		/// The repository that handle tracks.
		/// </summary>
		public ITrackRepository TrackRepository { get; }
		
		/// <summary>
		/// The repository that handle people.
		/// </summary>
		public IPeopleRepository PeopleRepository { get; }
		
		/// <summary>
		/// The repository that handle studios.
		/// </summary>
		public IStudioRepository StudioRepository { get; }
		
		/// <summary>
		/// The repository that handle genres.
		/// </summary>
		public IGenreRepository GenreRepository { get; }
		
		/// <summary>
		/// The repository that handle providers.
		/// </summary>
		public IProviderRepository ProviderRepository { get; }
		
		
		/// <summary>
		/// Create a new <see cref="LibraryManager"/> instancce with every repository available.
		/// </summary>
		/// <param name="repositories">The list of repositories that this library manager should manage. If a repository for every base type is not available, this instance won't be stable.</param>
		public LibraryManager(IEnumerable<IBaseRepository> repositories)
		{
			_repositories = repositories.ToArray();
			LibraryRepository = GetRepository<Library>() as ILibraryRepository;
			LibraryItemRepository = GetRepository<LibraryItem>() as ILibraryItemRepository;
			CollectionRepository = GetRepository<Collection>() as ICollectionRepository;
			ShowRepository = GetRepository<Show>() as IShowRepository;
			SeasonRepository = GetRepository<Season>() as ISeasonRepository;
			EpisodeRepository = GetRepository<Episode>() as IEpisodeRepository;
			TrackRepository = GetRepository<Track>() as ITrackRepository;
			PeopleRepository = GetRepository<People>() as IPeopleRepository;
			StudioRepository = GetRepository<Studio>() as IStudioRepository;
			GenreRepository = GetRepository<Genre>() as IGenreRepository;
			ProviderRepository = GetRepository<Provider>() as IProviderRepository;
		}
		
		/// <summary>
		/// Performs application-defined tasks associated with freeing, releasing, or resetting unmanaged resources.
		/// </summary>
		public void Dispose()
		{
			foreach (IBaseRepository repo in _repositories)
				repo.Dispose();
			GC.SuppressFinalize(this);
		}

		/// <summary>
		/// Performs application-defined tasks associated with freeing, releasing, or resetting unmanaged resources asynchronously.
		/// </summary>
		/// <returns>A task that represents the asynchronous dispose operation.</returns>
		public async ValueTask DisposeAsync()
		{
			await Task.WhenAll(_repositories.Select(x => x.DisposeAsync().AsTask()));
		}

		/// <summary>
		/// Get the repository corresponding to the T item.
		/// </summary>
		/// <typeparam name="T">The type you want</typeparam>
		/// <exception cref="ItemNotFound">If the item is not found</exception>
		/// <returns>The repository corresponding</returns>
		public IRepository<T> GetRepository<T>()
			where T : class, IResource
		{
			if (_repositories.FirstOrDefault(x => x.RepositoryType == typeof(T)) is IRepository<T> ret)
				return ret;
			throw new ItemNotFound();
		}

		/// <summary>
		/// Get the resource by it's ID
		/// </summary>
		/// <param name="id">The id of the resource</param>
		/// <typeparam name="T">The type of the resource</typeparam>
		/// <exception cref="ItemNotFound">If the item is not found</exception>
		/// <returns>The resource found</returns>
		public Task<T> Get<T>(int id)
			where T : class, IResource
		{
			return GetRepository<T>().Get(id);
		}

		/// <summary>
		/// Get the resource by it's slug
		/// </summary>
		/// <param name="slug">The slug of the resource</param>
		/// <typeparam name="T">The type of the resource</typeparam>
		/// <exception cref="ItemNotFound">If the item is not found</exception>
		/// <returns>The resource found</returns>
		public Task<T> Get<T>(string slug) 
			where T : class, IResource
		{
			return GetRepository<T>().Get(slug);
		}

		/// <summary>
		/// Get the resource by a filter function.
		/// </summary>
		/// <param name="where">The filter function.</param>
		/// <typeparam name="T">The type of the resource</typeparam>
		/// <exception cref="ItemNotFound">If the item is not found</exception>
		/// <returns>The first resource found that match the where function</returns>
		public Task<T> Get<T>(Expression<Func<T, bool>> where)
			where T : class, IResource
		{
			return GetRepository<T>().Get(where);
		}

		/// <summary>
		/// Get a season from it's showID and it's seasonNumber
		/// </summary>
		/// <param name="showID">The id of the show</param>
		/// <param name="seasonNumber">The season's number</param>
		/// <exception cref="ItemNotFound">If the item is not found</exception>
		/// <returns>The season found</returns>
		public Task<Season> Get(int showID, int seasonNumber)
		{
			return SeasonRepository.Get(showID, seasonNumber);
		}

		/// <summary>
		/// Get a season from it's show slug and it's seasonNumber
		/// </summary>
		/// <param name="showSlug">The slug of the show</param>
		/// <param name="seasonNumber">The season's number</param>
		/// <exception cref="ItemNotFound">If the item is not found</exception>
		/// <returns>The season found</returns>
		public Task<Season> Get(string showSlug, int seasonNumber)
		{
			return SeasonRepository.Get(showSlug, seasonNumber);
		}

		/// <summary>
		/// Get a episode from it's showID, it's seasonNumber and it's episode number.
		/// </summary>
		/// <param name="showID">The id of the show</param>
		/// <param name="seasonNumber">The season's number</param>
		/// <param name="episodeNumber">The episode's number</param>
		/// <exception cref="ItemNotFound">If the item is not found</exception>
		/// <returns>The episode found</returns>
		public Task<Episode> Get(int showID, int seasonNumber, int episodeNumber)
		{
			return EpisodeRepository.Get(showID, seasonNumber, episodeNumber);
		}

		/// <summary>
		/// Get a episode from it's show slug, it's seasonNumber and it's episode number.
		/// </summary>
		/// <param name="showSlug">The slug of the show</param>
		/// <param name="seasonNumber">The season's number</param>
		/// <param name="episodeNumber">The episode's number</param>
		/// <exception cref="ItemNotFound">If the item is not found</exception>
		/// <returns>The episode found</returns>
		public Task<Episode> Get(string showSlug, int seasonNumber, int episodeNumber)
		{
			return EpisodeRepository.Get(showSlug, seasonNumber, episodeNumber);
		}

		/// <summary>
		/// Get a tracck from it's slug and it's type.
		/// </summary>
		/// <param name="slug">The slug of the track</param>
		/// <param name="type">The type (Video, Audio or Subtitle)</param>
		/// <exception cref="ItemNotFound">If the item is not found</exception>
		/// <returns>The tracl found</returns>
		public Task<Track> Get(string slug, StreamType type = StreamType.Unknown)
		{
			return TrackRepository.Get(slug, type);
		}

		/// <summary>
		/// Get the resource by it's ID or null if it is not found.
		/// </summary>
		/// <param name="id">The id of the resource</param>
		/// <typeparam name="T">The type of the resource</typeparam>
		/// <returns>The resource found</returns>
		public async Task<T> GetOrDefault<T>(int id) 
			where T : class, IResource
		{
			return await GetRepository<T>().GetOrDefault(id);
		}
		
		/// <summary>
		/// Get the resource by it's slug or null if it is not found.
		/// </summary>
		/// <param name="slug">The slug of the resource</param>
		/// <typeparam name="T">The type of the resource</typeparam>
		/// <returns>The resource found</returns>
		public async Task<T> GetOrDefault<T>(string slug) 
			where T : class, IResource
		{
			return await GetRepository<T>().GetOrDefault(slug);
		}
		
		/// <summary>
		/// Get the resource by a filter function or null if it is not found.
		/// </summary>
		/// <param name="where">The filter function.</param>
		/// <typeparam name="T">The type of the resource</typeparam>
		/// <returns>The first resource found that match the where function</returns>
		public async Task<T> GetOrDefault<T>(Expression<Func<T, bool>> where)
			where T : class, IResource
		{
			return await GetRepository<T>().GetOrDefault(where);
		}

		/// <summary>
		/// Get a season from it's showID and it's seasonNumber or null if it is not found.
		/// </summary>
		/// <param name="showID">The id of the show</param>
		/// <param name="seasonNumber">The season's number</param>
		/// <returns>The season found</returns>
		public async Task<Season> GetOrDefault(int showID, int seasonNumber)
		{
			return await SeasonRepository.GetOrDefault(showID, seasonNumber);
		}
		
		/// <summary>
		/// Get a season from it's show slug and it's seasonNumber or null if it is not found.
		/// </summary>
		/// <param name="showSlug">The slug of the show</param>
		/// <param name="seasonNumber">The season's number</param>
		/// <returns>The season found</returns>
		public async Task<Season> GetOrDefault(string showSlug, int seasonNumber)
		{
			return await SeasonRepository.GetOrDefault(showSlug, seasonNumber);
		}
		
		/// <summary>
		/// Get a episode from it's showID, it's seasonNumber and it's episode number or null if it is not found.
		/// </summary>
		/// <param name="showID">The id of the show</param>
		/// <param name="seasonNumber">The season's number</param>
		/// <param name="episodeNumber">The episode's number</param>
		/// <returns>The episode found</returns>
		public async Task<Episode> GetOrDefault(int showID, int seasonNumber, int episodeNumber)
		{
			return await EpisodeRepository.GetOrDefault(showID, seasonNumber, episodeNumber);
		}
		
		/// <summary>
		/// Get a episode from it's show slug, it's seasonNumber and it's episode number or null if it is not found.
		/// </summary>
		/// <param name="showSlug">The slug of the show</param>
		/// <param name="seasonNumber">The season's number</param>
		/// <param name="episodeNumber">The episode's number</param>
		/// <returns>The episode found</returns>
		public async Task<Episode> GetOrDefault(string showSlug, int seasonNumber, int episodeNumber)
		{
			return await EpisodeRepository.GetOrDefault(showSlug, seasonNumber, episodeNumber);
		}

		/// <summary>
		/// Get a track from it's slug and it's type or null if it is not found.
		/// </summary>
		/// <param name="slug">The slug of the track</param>
		/// <param name="type">The type (Video, Audio or Subtitle)</param>
		/// <returns>The tracl found</returns>
		public async Task<Track> GetOrDefault(string slug, StreamType type = StreamType.Unknown)
		{
			return await TrackRepository.GetOrDefault(slug, type);
		}
		
		/// <summary>
		/// Load a related resource
		/// </summary>
		/// <param name="obj">The source object.</param>
		/// <param name="member">A getter function for the member to load</param>
		/// <typeparam name="T">The type of the source object</typeparam>
		/// <typeparam name="T2">The related resource's type</typeparam>
		/// <returns>The param <see cref="obj"/></returns>
		public Task<T> Load<T, T2>(T obj, Expression<Func<T, T2>> member)
			where T : class, IResource
			where T2 : class, IResource, new()
		{
			if (member == null)
				throw new ArgumentNullException(nameof(member));
			return Load(obj, Utility.GetPropertyName(member));
		}

		/// <summary>
		/// Load a collection of related resource
		/// </summary>
		/// <param name="obj">The source object.</param>
		/// <param name="member">A getter function for the member to load</param>
		/// <typeparam name="T">The type of the source object</typeparam>
		/// <typeparam name="T2">The related resource's type</typeparam>
		/// <returns>The param <see cref="obj"/></returns>
		public Task<T> Load<T, T2>(T obj, Expression<Func<T, ICollection<T2>>> member)
			where T : class, IResource
			where T2 : class, new()
		{
			if (member == null)
				throw new ArgumentNullException(nameof(member));
			return Load(obj, Utility.GetPropertyName(member));
		}

		/// <summary>
		/// Load a related resource by it's name
		/// </summary>
		/// <param name="obj">The source object.</param>
		/// <param name="memberName">The name of the resource to load (case sensitive)</param>
		/// <typeparam name="T">The type of the source object</typeparam>
		/// <returns>The param <see cref="obj"/></returns>
		public async Task<T> Load<T>(T obj, string memberName)
			where T : class, IResource
		{
			await Load(obj as IResource, memberName);
			return obj;
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
		private static async Task SetRelation<T1, T2>(T1 obj, 
			Task<ICollection<T2>> loader, 
			Action<T1, ICollection<T2>> setter, 
			Action<T2, T1> inverse)
		{
			ICollection<T2> loaded = await loader;
			setter(obj, loaded);
			foreach (T2 item in loaded)
				inverse(item, obj);
		}

		/// <summary>
		/// Load a related resource without specifing it's type.
		/// </summary>
		/// <param name="obj">The source object.</param>
		/// <param name="memberName">The name of the resource to load (case sensitive)</param>
		public Task Load(IResource obj, string memberName)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
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
				
				
				(Collection c, nameof(Library.Shows)) => ShowRepository
					.GetAll(x => x.Collections.Any(y => y.ID == obj.ID))
					.Then(x => c.Shows = x), 
				
				(Collection c, nameof(Collection.Libraries)) => LibraryRepository
					.GetAll(x => x.Collections.Any(y => y.ID == obj.ID))
					.Then(x => c.Libraries = x), 
				
				
				(Show s, nameof(Show.ExternalIDs)) => SetRelation(s, 
					ProviderRepository.GetMetadataID(x => x.ShowID == obj.ID),
					(x, y) => x.ExternalIDs = y,
					(x, y) => { x.Show = y; x.ShowID = y.ID; }),
				
				(Show s, nameof(Show.Genres)) => GenreRepository
					.GetAll(x => x.Shows.Any(y => y.ID == obj.ID))
					.Then(x => s.Genres = x),
				
				(Show s, nameof(Show.People)) => PeopleRepository
					.GetFromShow(obj.ID)
					.Then(x => s.People = x),
				
				(Show s, nameof(Show.Seasons)) => SetRelation(s, 
					SeasonRepository.GetAll(x => x.Show.ID == obj.ID),
					(x, y) => x.Seasons = y,
					(x, y) => { x.Show = y; x.ShowID = y.ID; }),
				
				(Show s, nameof(Show.Episodes)) => SetRelation(s, 
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
				
				
				(Season s, nameof(Season.ExternalIDs)) => SetRelation(s, 
					ProviderRepository.GetMetadataID(x => x.SeasonID == obj.ID),
					(x, y) => x.ExternalIDs = y,
					(x, y) => { x.Season = y; x.SeasonID = y.ID; }),
				
				(Season s, nameof(Season.Episodes)) => SetRelation(s, 
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
				
				
				(Episode e, nameof(Episode.ExternalIDs)) => SetRelation(e, 
					ProviderRepository.GetMetadataID(x => x.EpisodeID == obj.ID), 
					(x, y) => x.ExternalIDs = y,
					(x, y) => { x.Episode = y; x.EpisodeID = y.ID; }),
				
				(Episode e, nameof(Episode.Tracks)) => SetRelation(e, 
					TrackRepository.GetAll(x => x.Episode.ID == obj.ID),
					(x, y) => x.Tracks = y,
					(x, y) => { x.Episode = y; x.EpisodeID = y.ID; }),
				
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
				
				
				(Track t, nameof(Track.Episode)) => EpisodeRepository
					.GetOrDefault(x => x.Tracks.Any(y => y.ID == obj.ID))
					.Then(x =>
					{
						t.Episode = x;
						t.EpisodeID = x?.ID ?? 0;
					}),
				
				
				(Genre g, nameof(Genre.Shows)) => ShowRepository
					.GetAll(x => x.Genres.Any(y => y.ID == obj.ID))
					.Then(x => g.Shows = x),
				
				
				(Studio s, nameof(Studio.Shows)) => ShowRepository
					.GetAll(x => x.Studio.ID == obj.ID)
					.Then(x => s.Shows = x),
				
				
				(People p, nameof(People.ExternalIDs)) => SetRelation(p, 
					ProviderRepository.GetMetadataID(x => x.PeopleID == obj.ID),
					(x, y) => x.ExternalIDs = y,
					(x, y) => { x.People = y; x.PeopleID = y.ID; }),
				
				(People p, nameof(People.Roles)) => PeopleRepository
					.GetFromPeople(obj.ID)
					.Then(x => p.Roles = x),
				
				
				(Provider p, nameof(Provider.Libraries)) => LibraryRepository
					.GetAll(x => x.Providers.Any(y => y.ID == obj.ID))
					.Then(x => p.Libraries = x),
				

				_ => throw new ArgumentException($"Couldn't find a way to load {memberName} of {obj.Slug}.")
			};
		}

		/// <summary>
		/// Get items (A wrapper arround shows or collections) from a library.
		/// </summary>
		/// <param name="id">The ID of the library</param>
		/// <param name="where">A filter function</param>
		/// <param name="sort">Sort informations (sort order & sort by)</param>
		/// <param name="limit">How many items to return and where to start</param>
		/// <returns>A list of items that match every filters</returns>
		public Task<ICollection<LibraryItem>> GetItemsFromLibrary(int id, 
			Expression<Func<LibraryItem, bool>> where = null, 
			Sort<LibraryItem> sort = default, 
			Pagination limit = default)
		{
			return LibraryItemRepository.GetFromLibrary(id, where, sort, limit);
		}

		/// <summary>
		/// Get items (A wrapper arround shows or collections) from a library.
		/// </summary>
		/// <param name="slug">The slug of the library</param>
		/// <param name="where">A filter function</param>
		/// <param name="sort">Sort informations (sort order & sort by)</param>
		/// <param name="limit">How many items to return and where to start</param>
		/// <returns>A list of items that match every filters</returns>
		public Task<ICollection<LibraryItem>> GetItemsFromLibrary(string slug, 
			Expression<Func<LibraryItem, bool>> where = null, 
			Sort<LibraryItem> sort = default, 
			Pagination limit = default)
		{
			return LibraryItemRepository.GetFromLibrary(slug, where, sort, limit);
		}

		/// <summary>
		/// Get people's roles from a show.
		/// </summary>
		/// <param name="showID">The ID of the show</param>
		/// <param name="where">A filter function</param>
		/// <param name="sort">Sort informations (sort order & sort by)</param>
		/// <param name="limit">How many items to return and where to start</param>
		/// <returns>A list of items that match every filters</returns>
		public Task<ICollection<PeopleRole>> GetPeopleFromShow(int showID, 
			Expression<Func<PeopleRole, bool>> where = null,
			Sort<PeopleRole> sort = default,
			Pagination limit = default)
		{
			return PeopleRepository.GetFromShow(showID, where, sort, limit);
		}

		/// <summary>
		/// Get people's roles from a show.
		/// </summary>
		/// <param name="showSlug">The slug of the show</param>
		/// <param name="where">A filter function</param>
		/// <param name="sort">Sort informations (sort order & sort by)</param>
		/// <param name="limit">How many items to return and where to start</param>
		/// <returns>A list of items that match every filters</returns>
		public Task<ICollection<PeopleRole>> GetPeopleFromShow(string showSlug, 
			Expression<Func<PeopleRole, bool>> where = null,
			Sort<PeopleRole> sort = default, 
			Pagination limit = default)
		{
			return PeopleRepository.GetFromShow(showSlug, where, sort, limit);
		}

		/// <summary>
		/// Get people's roles from a person.
		/// </summary>
		/// <param name="id">The id of the person</param>
		/// <param name="where">A filter function</param>
		/// <param name="sort">Sort informations (sort order & sort by)</param>
		/// <param name="limit">How many items to return and where to start</param>
		/// <returns>A list of items that match every filters</returns>
		public Task<ICollection<PeopleRole>> GetRolesFromPeople(int id, 
			Expression<Func<PeopleRole, bool>> where = null,
			Sort<PeopleRole> sort = default,
			Pagination limit = default)
		{
			return PeopleRepository.GetFromPeople(id, where, sort, limit);
		}

		/// <summary>
		/// Get people's roles from a person.
		/// </summary>
		/// <param name="slug">The slug of the person</param>
		/// <param name="where">A filter function</param>
		/// <param name="sort">Sort informations (sort order & sort by)</param>
		/// <param name="limit">How many items to return and where to start</param>
		/// <returns>A list of items that match every filters</returns>
		public Task<ICollection<PeopleRole>> GetRolesFromPeople(string slug,
			Expression<Func<PeopleRole, bool>> where = null,
			Sort<PeopleRole> sort = default,
			Pagination limit = default)
		{
			return PeopleRepository.GetFromPeople(slug, where, sort, limit);
		}

		/// <summary>
		/// Setup relations between a show, a library and a collection
		/// </summary>
		/// <param name="showID">The show's ID to setup relations with</param>
		/// <param name="libraryID">The library's ID to setup relations with (optional)</param>
		/// <param name="collectionID">The collection's ID to setup relations with (optional)</param>
		public Task AddShowLink(int showID, int? libraryID, int? collectionID)
		{
			return ShowRepository.AddShowLink(showID, libraryID, collectionID);
		}

		/// <summary>
		/// Setup relations between a show, a library and a collection
		/// </summary>
		/// <param name="show">The show to setup relations with</param>
		/// <param name="library">The library to setup relations with (optional)</param>
		/// <param name="collection">The collection to setup relations with (optional)</param>
		public Task AddShowLink(Show show, Library library, Collection collection)
		{
			if (show == null)
				throw new ArgumentNullException(nameof(show));
			return ShowRepository.AddShowLink(show.ID, library?.ID, collection?.ID);
		}

		/// <summary>
		/// Get all resources with filters
		/// </summary>
		/// <param name="where">A filter function</param>
		/// <param name="sort">Sort informations (sort order & sort by)</param>
		/// <param name="limit">How many items to return and where to start</param>
		/// <typeparam name="T">The type of resources to load</typeparam>
		/// <returns>A list of resources that match every filters</returns>
		public Task<ICollection<T>> GetAll<T>(Expression<Func<T, bool>> where = null,
			Sort<T> sort = default,
			Pagination limit = default) 
			where T : class, IResource
		{
			return GetRepository<T>().GetAll(where, sort, limit);
		}

		/// <summary>
		/// Get the count of resources that match the filter
		/// </summary>
		/// <param name="where">A filter function</param>
		/// <typeparam name="T">The type of resources to load</typeparam>
		/// <returns>A list of resources that match every filters</returns>
		public Task<int> GetCount<T>(Expression<Func<T, bool>> where = null)
			where T : class, IResource
		{
			return GetRepository<T>().GetCount(where);
		}

		/// <summary>
		/// Search for a resource
		/// </summary>
		/// <param name="query">The search query</param>
		/// <typeparam name="T">The type of resources</typeparam>
		/// <returns>A list of 20 items that match the search query</returns>
		public Task<ICollection<T>> Search<T>(string query) 
			where T : class, IResource
		{
			return GetRepository<T>().Search(query);
		}

		/// <summary>
		/// Create a new resource.
		/// </summary>
		/// <param name="item">The item to register</param>
		/// <typeparam name="T">The type of resource</typeparam>
		/// <returns>The resource registers and completed by database's informations (related items & so on)</returns>
		public Task<T> Create<T>(T item) 
			where T : class, IResource
		{
			return GetRepository<T>().Create(item);
		}
		
		/// <summary>
		/// Create a new resource if it does not exist already. If it does, the existing value is returned instead.
		/// </summary>
		/// <param name="item">The object to create</param>
		/// <typeparam name="T">The type of resource</typeparam>
		/// <returns>The newly created item or the existing value if it existed.</returns>
		public Task<T> CreateIfNotExists<T>(T item)
			where T : class, IResource
		{
			return GetRepository<T>().CreateIfNotExists(item);
		}

		/// <summary>
		/// Edit a resource
		/// </summary>
		/// <param name="item">The resourcce to edit, it's ID can't change.</param>
		/// <param name="resetOld">Should old properties of the resource be discarded or should null values considered as not changed?</param>
		/// <typeparam name="T">The type of resources</typeparam>
		/// <exception cref="ItemNotFound">If the item is not found</exception>
		/// <returns>The resource edited and completed by database's informations (related items & so on)</returns>
		public Task<T> Edit<T>(T item, bool resetOld)
			where T : class, IResource
		{
			return GetRepository<T>().Edit(item, resetOld);
		}

		/// <summary>
		/// Delete a resource.
		/// </summary>
		/// <param name="item">The resource to delete</param>
		/// <typeparam name="T">The type of resource to delete</typeparam>
		/// <exception cref="ItemNotFound">If the item is not found</exception>
		public Task Delete<T>(T item) 
			where T : class, IResource
		{
			return GetRepository<T>().Delete(item);
		}

		/// <summary>
		/// Delete a resource by it's ID.
		/// </summary>
		/// <param name="id">The id of the resource to delete</param>
		/// <typeparam name="T">The type of resource to delete</typeparam>
		/// <exception cref="ItemNotFound">If the item is not found</exception>
		public Task Delete<T>(int id) 
			where T : class, IResource
		{
			return GetRepository<T>().Delete(id);
		}

		/// <summary>
		/// Delete a resource by it's slug.
		/// </summary>
		/// <param name="slug">The slug of the resource to delete</param>
		/// <typeparam name="T">The type of resource to delete</typeparam>
		/// <exception cref="ItemNotFound">If the item is not found</exception>
		public Task Delete<T>(string slug) 
			where T : class, IResource
		{
			return GetRepository<T>().Delete(slug);
		}
	}
}
