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
		public ITrackRepository TrackRepository { get; }
		/// <inheritdoc />
		public IPeopleRepository PeopleRepository { get; }
		/// <inheritdoc />
		public IStudioRepository StudioRepository { get; }
		/// <inheritdoc />
		public IGenreRepository GenreRepository { get; }
		/// <inheritdoc />
		public IProviderRepository ProviderRepository { get; }
		
		
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
			TrackRepository = GetRepository<Track>() as ITrackRepository;
			PeopleRepository = GetRepository<People>() as IPeopleRepository;
			StudioRepository = GetRepository<Studio>() as IStudioRepository;
			GenreRepository = GetRepository<Genre>() as IGenreRepository;
			ProviderRepository = GetRepository<Provider>() as IProviderRepository;
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
		public Task<Track> Get(string slug, StreamType type = StreamType.Unknown)
		{
			return TrackRepository.Get(slug, type);
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
		public async Task<T> GetOrDefault<T>(Expression<Func<T, bool>> where)
			where T : class, IResource
		{
			return await GetRepository<T>().GetOrDefault(where);
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

		/// <inheritdoc />
		public async Task<Track> GetOrDefault(string slug, StreamType type = StreamType.Unknown)
		{
			return await TrackRepository.GetOrDefault(slug, type);
		}
		
		/// <inheritdoc />
		public Task<T> Load<T, T2>(T obj, Expression<Func<T, T2>> member)
			where T : class, IResource
			where T2 : class, IResource, new()
		{
			if (member == null)
				throw new ArgumentNullException(nameof(member));
			return Load(obj, Utility.GetPropertyName(member));
		}

		/// <inheritdoc />
		public Task<T> Load<T, T2>(T obj, Expression<Func<T, ICollection<T2>>> member)
			where T : class, IResource
			where T2 : class, new()
		{
			if (member == null)
				throw new ArgumentNullException(nameof(member));
			return Load(obj, Utility.GetPropertyName(member));
		}

		/// <inheritdoc />
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

		/// <inheritdoc />
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
