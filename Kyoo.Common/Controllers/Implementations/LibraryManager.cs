using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Models;

namespace Kyoo.Controllers
{
	public class LibraryManager : ILibraryManager
	{
		public ILibraryRepository LibraryRepository { get; }
		public ILibraryItemRepository LibraryItemRepository { get; }
		public ICollectionRepository CollectionRepository { get; }
		public IShowRepository ShowRepository { get; }
		public ISeasonRepository SeasonRepository { get; }
		public IEpisodeRepository EpisodeRepository { get; }
		public ITrackRepository TrackRepository { get; }
		public IGenreRepository GenreRepository { get; }
		public IStudioRepository StudioRepository { get; }
		public IPeopleRepository PeopleRepository { get; }
		public IProviderRepository ProviderRepository { get; }

		public LibraryManager(ILibraryRepository libraryRepository, 
			ILibraryItemRepository libraryItemRepository,
			ICollectionRepository collectionRepository, 
			IShowRepository showRepository, 
			ISeasonRepository seasonRepository, 
			IEpisodeRepository episodeRepository,
			ITrackRepository trackRepository, 
			IGenreRepository genreRepository, 
			IStudioRepository studioRepository,
			IProviderRepository providerRepository, 
			IPeopleRepository peopleRepository)
		{
			LibraryRepository = libraryRepository;
			LibraryItemRepository = libraryItemRepository;
			CollectionRepository = collectionRepository;
			ShowRepository = showRepository;
			SeasonRepository = seasonRepository;
			EpisodeRepository = episodeRepository;
			TrackRepository = trackRepository;
			GenreRepository = genreRepository;
			StudioRepository = studioRepository;
			ProviderRepository = providerRepository;
			PeopleRepository = peopleRepository;
		}
		
		public void Dispose()
		{
			LibraryRepository.Dispose();
			CollectionRepository.Dispose();
			ShowRepository.Dispose();
			SeasonRepository.Dispose();
			EpisodeRepository.Dispose();
			TrackRepository.Dispose();
			GenreRepository.Dispose();
			StudioRepository.Dispose();
			PeopleRepository.Dispose();
			ProviderRepository.Dispose();
		}
		
		public async ValueTask DisposeAsync()
		{
			await Task.WhenAll(
				LibraryRepository.DisposeAsync().AsTask(),
				CollectionRepository.DisposeAsync().AsTask(),
				ShowRepository.DisposeAsync().AsTask(),
				SeasonRepository.DisposeAsync().AsTask(),
				EpisodeRepository.DisposeAsync().AsTask(),
				TrackRepository.DisposeAsync().AsTask(),
				GenreRepository.DisposeAsync().AsTask(),
				StudioRepository.DisposeAsync().AsTask(),
				PeopleRepository.DisposeAsync().AsTask(),
				ProviderRepository.DisposeAsync().AsTask()
			);
		}

		public Task<Library> GetLibrary(int id)
		{
			return LibraryRepository.Get(id);
		}

		public Task<Collection> GetCollection(int id)
		{
			return CollectionRepository.Get(id);
		}

		public Task<Show> GetShow(int id)
		{
			return ShowRepository.Get(id);
		}

		public Task<Season> GetSeason(int id)
		{
			return SeasonRepository.Get(id);
		}
		
		public Task<Season> GetSeason(int showID, int seasonNumber)
		{
			return SeasonRepository.Get(showID, seasonNumber);
		}
		
		public Task<Episode> GetEpisode(int id)
		{
			return EpisodeRepository.Get(id);
		}

		public Task<Episode> GetEpisode(int showID, int seasonNumber, int episodeNumber)
		{
			return EpisodeRepository.Get(showID, seasonNumber, episodeNumber);
		}

		public Task<Track> GetTrack(string slug, StreamType type = StreamType.Unknown)
		{
			return TrackRepository.Get(slug, type);
		}

		public Task<Genre> GetGenre(int id)
		{
			return GenreRepository.Get(id);
		}

		public Task<Studio> GetStudio(int id)
		{
			return StudioRepository.Get(id);
		}

		public Task<People> GetPeople(int id)
		{
			return PeopleRepository.Get(id);
		}

		public Task<Library> GetLibrary(string slug)
		{
			return LibraryRepository.Get(slug);
		}

		public Task<Collection> GetCollection(string slug)
		{
			return CollectionRepository.Get(slug);
		}

		public Task<Show> GetShow(string slug)
		{
			return ShowRepository.Get(slug);
		}
		
		public Task<Season> GetSeason(string slug)
		{
			return SeasonRepository.Get(slug);
		}

		public Task<Season> GetSeason(string showSlug, int seasonNumber)
		{
			return SeasonRepository.Get(showSlug, seasonNumber);
		}

		public Task<Episode> GetEpisode(string slug)
		{
			return EpisodeRepository.Get(slug);
		}
		
		public Task<Episode> GetEpisode(string showSlug, int seasonNumber, int episodeNumber)
		{
			return EpisodeRepository.Get(showSlug, seasonNumber, episodeNumber);
		}

		public Task<Episode> GetMovieEpisode(string movieSlug)
		{
			return EpisodeRepository.Get(movieSlug);
		}

		public Task<Track> GetTrack(int id)
		{
			return TrackRepository.Get(id);
		}

		public Task<Genre> GetGenre(string slug)
		{
			return GenreRepository.Get(slug);
		}

		public Task<Studio> GetStudio(string slug)
		{
			return StudioRepository.Get(slug);
		}

		public Task<People> GetPeople(string slug)
		{
			return PeopleRepository.Get(slug);
		}

		public Task<Library> GetLibrary(Expression<Func<Library, bool>> where)
		{
			return LibraryRepository.Get(where);
		}

		public Task<Collection> GetCollection(Expression<Func<Collection, bool>> where)
		{
			return CollectionRepository.Get(where);
		}

		public Task<Show> GetShow(Expression<Func<Show, bool>> where)
		{
			return ShowRepository.Get(where);
		}

		public Task<Season> GetSeason(Expression<Func<Season, bool>> where)
		{
			return SeasonRepository.Get(where);
		}

		public Task<Episode> GetEpisode(Expression<Func<Episode, bool>> where)
		{
			return EpisodeRepository.Get(where);
		}

		public Task<Track> GetTrack(Expression<Func<Track, bool>> where)
		{
			return TrackRepository.Get(where);
		}

		public Task<Genre> GetGenre(Expression<Func<Genre, bool>> where)
		{
			return GenreRepository.Get(where);
		}

		public Task<Studio> GetStudio(Expression<Func<Studio, bool>> where)
		{
			return StudioRepository.Get(where);
		}

		public Task<People> GetPerson(Expression<Func<People, bool>> where)
		{
			return PeopleRepository.Get(where);
		}

		public Task<T> Load<T, T2>(T obj, Expression<Func<T, T2>> member)
			where T : class, IResource
			where T2 : class, IResource, new()
		{
			if (member == null)
				throw new ArgumentNullException(nameof(member));
			return Load(obj, Utility.GetPropertyName(member));
		}

		public Task<T> Load<T, T2>(T obj, Expression<Func<T, ICollection<T2>>> member)
			where T : class, IResource
			where T2 : class, new()
		{
			if (member == null)
				throw new ArgumentNullException(nameof(member));
			return Load(obj, Utility.GetPropertyName(member));
		}

		public async Task<T> Load<T>(T obj, string member)
			where T : class, IResource
		{
			await Load(obj as IResource, member);
			return obj;
		}

		public Task Load(IResource obj, string member)
		{
			return (obj, member) switch
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
				
				(Show s, nameof(Show.ExternalIDs)) => ProviderRepository
					.GetMetadataID(x => x.ShowID == obj.ID)
					.Then(x => s.ExternalIDs = x),
				(Show s, nameof(Show.Genres)) => GenreRepository
					.GetAll(x => x.Shows.Any(y => y.ID == obj.ID))
					.Then(x => s.Genres = x),
				(Show s, nameof(Show.People)) => PeopleRepository
					.GetFromShow(obj.ID)
					.Then(x => s.People = x),
				(Show s, nameof(Show.Seasons)) => SeasonRepository
					.GetAll(x => x.Show.ID == obj.ID)
					.Then(x => s.Seasons = x),
				(Show s, nameof(Show.Episodes)) => EpisodeRepository
					.GetAll(x => x.Show.ID == obj.ID)
					.Then(x => s.Episodes = x),
				(Show s, nameof(Show.Libraries)) => LibraryRepository
					.GetAll(x => x.Shows.Any(y => y.ID == obj.ID))
					.Then(x => s.Libraries = x),
				(Show s, nameof(Show.Collections)) => CollectionRepository
					.GetAll(x => x.Shows.Any(y => y.ID == obj.ID))
					.Then(x => s.Collections = x),
				// TODO Studio loading does not work.
				(Show s, nameof(Show.Studio)) => StudioRepository
					.Get(x => x.Shows.Any(y => y.ID == obj.ID))
					.Then(x => s.Studio = x),
				
				(Season s, nameof(Season.ExternalIDs)) => ProviderRepository
					.GetMetadataID(x => x.SeasonID == obj.ID)
					.Then(x => s.ExternalIDs = x),
				(Season s, nameof(Season.Episodes)) => EpisodeRepository
					.GetAll(x => x.Season.ID == obj.ID)
					.Then(x => s.Episodes = x),
				(Season s, nameof(Season.Show)) => ShowRepository
					.Get(x => x.Seasons.Any(y => y.ID == obj.ID))
					.Then(x => s.Show = x),
				
				(Episode e, nameof(Episode.ExternalIDs)) => ProviderRepository
					.GetMetadataID(x => x.EpisodeID == obj.ID)
					.Then(x => e.ExternalIDs = x),
				(Episode e, nameof(Episode.Tracks)) => TrackRepository
					.GetAll(x => x.Episode.ID == obj.ID)
					.Then(x => e.Tracks = x),
				(Episode e, nameof(Episode.Show)) => ShowRepository
					.Get(x => x.Episodes.Any(y => y.ID == obj.ID))
					.Then(x => e.Show = x),
				(Episode e, nameof(Episode.Season)) => SeasonRepository
					.Get(x => x.Episodes.Any(y => y.ID == e.ID))
					.Then(x => e.Season = x),
				
				(Track t, nameof(Track.Episode)) => EpisodeRepository
					.Get(x => x.Tracks.Any(y => y.ID == obj.ID))
					.Then(x => t.Episode = x),
				
				(Genre g, nameof(Genre.Shows)) => ShowRepository
					.GetAll(x => x.Genres.Any(y => y.ID == obj.ID))
					.Then(x => g.Shows = x),
				
				(Studio s, nameof(Studio.Shows)) => ShowRepository
					.GetAll(x => x.Studio.ID == obj.ID)
					.Then(x => s.Shows = x),
				
				(People p, nameof(People.ExternalIDs)) => ProviderRepository
					.GetMetadataID(x => x.PeopleID == obj.ID)
					.Then(x => p.ExternalIDs = x),
				(People p, nameof(People.Roles)) => PeopleRepository
					.GetFromPeople(obj.ID)
					.Then(x => p.Roles = x),
				
				(ProviderID p, nameof(ProviderID.Libraries)) => LibraryRepository
					.GetAll(x => x.Providers.Any(y => y.ID == obj.ID))
					.Then(x => p.Libraries = x),

				_ => throw new ArgumentException($"Couldn't find a way to load {member} of {obj.Slug}.")
			};
		}
		
		public Task<ICollection<Library>> GetLibraries(Expression<Func<Library, bool>> where = null, 
			Sort<Library> sort = default,
			Pagination page = default)
		{
			return LibraryRepository.GetAll(where, sort, page);
		}

		public Task<ICollection<Collection>> GetCollections(Expression<Func<Collection, bool>> where = null, 
			Sort<Collection> sort = default,
			Pagination page = default)
		{
			return CollectionRepository.GetAll(where, sort, page);
		}

		public Task<ICollection<Show>> GetShows(Expression<Func<Show, bool>> where = null, 
			Sort<Show> sort = default,
			Pagination limit = default)
		{
			return ShowRepository.GetAll(where, sort, limit);
		}

		public Task<ICollection<Season>> GetSeasons(Expression<Func<Season, bool>> where = null,
			Sort<Season> sort = default,
			Pagination limit = default)
		{
			return SeasonRepository.GetAll(where, sort, limit);
		}

		public Task<ICollection<Episode>> GetEpisodes(Expression<Func<Episode, bool>> where = null, 
			Sort<Episode> sort = default,
			Pagination limit = default)
		{
			return EpisodeRepository.GetAll(where, sort, limit);
		}

		public Task<ICollection<Track>> GetTracks(Expression<Func<Track, bool>> where = null, 
			Sort<Track> sort = default,
			Pagination page = default)
		{
			return TrackRepository.GetAll(where, sort, page);
		}

		public Task<ICollection<Studio>> GetStudios(Expression<Func<Studio, bool>> where = null, 
			Sort<Studio> sort = default,
			Pagination page = default)
		{
			return StudioRepository.GetAll(where, sort, page);
		}

		public Task<ICollection<People>> GetPeople(Expression<Func<People, bool>> where = null, 
			Sort<People> sort = default,
			Pagination page = default)
		{
			return PeopleRepository.GetAll(where, sort, page);
		}

		public Task<ICollection<Genre>> GetGenres(Expression<Func<Genre, bool>> where = null, 
			Sort<Genre> sort = default,
			Pagination page = default)
		{
			return GenreRepository.GetAll(where, sort, page);
		}

		public Task<ICollection<ProviderID>> GetProviders(Expression<Func<ProviderID, bool>> where = null, 
			Sort<ProviderID> sort = default,
			Pagination page = default)
		{
			return ProviderRepository.GetAll(where, sort, page); 
		}

		public Task<ICollection<LibraryItem>> GetItemsFromLibrary(int id, 
			Expression<Func<LibraryItem, bool>> where = null, 
			Sort<LibraryItem> sort = default, 
			Pagination limit = default)
		{
			return LibraryItemRepository.GetFromLibrary(id, where, sort, limit);
		}

		public Task<ICollection<LibraryItem>> GetItemsFromLibrary(string librarySlug,
			Expression<Func<LibraryItem, bool>> where = null,
			Sort<LibraryItem> sort = default, 
			Pagination limit = default)
		{
			return LibraryItemRepository.GetFromLibrary(librarySlug, where, sort, limit);
		}
		
		public Task<ICollection<PeopleRole>> GetPeopleFromShow(int showID,
			Expression<Func<PeopleRole, bool>> where = null,
			Sort<PeopleRole> sort = default,
			Pagination limit = default)
		{
			return PeopleRepository.GetFromShow(showID, where, sort, limit);
		}
		
		public Task<ICollection<PeopleRole>> GetPeopleFromShow(string showSlug,
			Expression<Func<PeopleRole, bool>> where = null,
			Sort<PeopleRole> sort = default,
			Pagination limit = default)
		{
			return PeopleRepository.GetFromShow(showSlug, where, sort, limit);
		}
		
		public Task<ICollection<PeopleRole>> GetRolesFromPeople(int id, 
			Expression<Func<PeopleRole, bool>> where = null, 
			Sort<PeopleRole> sort = default, 
			Pagination limit = default)
		{
			return PeopleRepository.GetFromPeople(id, where, sort, limit);
		}

		public Task<ICollection<PeopleRole>> GetRolesFromPeople(string slug, 
			Expression<Func<PeopleRole, bool>> where = null, 
			Sort<PeopleRole> sort = default, 
			Pagination limit = default)
		{
			return PeopleRepository.GetFromPeople(slug, where, sort, limit);
		}

		public Task<int> GetLibrariesCount(Expression<Func<Library, bool>> where = null)
		{
			return LibraryRepository.GetCount(where);
		}

		public Task<int> GetCollectionsCount(Expression<Func<Collection, bool>> where = null)
		{
			return CollectionRepository.GetCount(where);
		}

		public Task<int> GetShowsCount(Expression<Func<Show, bool>> where = null)
		{
			return ShowRepository.GetCount(where);
		}

		public Task<int> GetSeasonsCount(Expression<Func<Season, bool>> where = null)
		{
			return SeasonRepository.GetCount(where);
		}

		public Task<int> GetEpisodesCount(Expression<Func<Episode, bool>> where = null)
		{
			return EpisodeRepository.GetCount(where);
		}

		public Task<int> GetTracksCount(Expression<Func<Track, bool>> where = null)
		{
			return TrackRepository.GetCount(where);
		}

		public Task<int> GetGenresCount(Expression<Func<Genre, bool>> where = null)
		{
			return GenreRepository.GetCount(where);
		}

		public Task<int> GetStudiosCount(Expression<Func<Studio, bool>> where = null)
		{
			return StudioRepository.GetCount(where);
		}

		public Task<int> GetPeopleCount(Expression<Func<People, bool>> where = null)
		{
			return PeopleRepository.GetCount(where);
		}

		public Task AddShowLink(int showID, int? libraryID, int? collectionID)
		{
			return ShowRepository.AddShowLink(showID, libraryID, collectionID);
		}

		public Task AddShowLink(Show show, Library library, Collection collection)
		{
			if (show == null)
				throw new ArgumentNullException(nameof(show));
			return AddShowLink(show.ID, library?.ID, collection?.ID);
		}
		
		public Task<ICollection<Library>> SearchLibraries(string searchQuery)
		{
			return LibraryRepository.Search(searchQuery);
		}

		public Task<ICollection<Collection>> SearchCollections(string searchQuery)
		{
			return CollectionRepository.Search(searchQuery);
		}

		public Task<ICollection<Show>> SearchShows(string searchQuery)
		{
			return ShowRepository.Search(searchQuery);
		}

		public Task<ICollection<Season>> SearchSeasons(string searchQuery)
		{
			return SeasonRepository.Search(searchQuery);
		}

		public Task<ICollection<Episode>> SearchEpisodes(string searchQuery)
		{
			return EpisodeRepository.Search(searchQuery);
		}

		public Task<ICollection<Genre>> SearchGenres(string searchQuery)
		{
			return GenreRepository.Search(searchQuery);
		}

		public Task<ICollection<Studio>> SearchStudios(string searchQuery)
		{
			return StudioRepository.Search(searchQuery);
		}

		public Task<ICollection<People>> SearchPeople(string searchQuery)
		{
			return PeopleRepository.Search(searchQuery);
		}
		
		public Task<Library> RegisterLibrary(Library library)
		{
			return LibraryRepository.Create(library);
		}

		public Task<Collection> RegisterCollection(Collection collection)
		{
			return CollectionRepository.Create(collection);
		}

		public Task<Show> RegisterShow(Show show)
		{
			return ShowRepository.Create(show);
		}

		public Task<Season> RegisterSeason(Season season)
		{
			return SeasonRepository.Create(season);
		}

		public Task<Episode> RegisterEpisode(Episode episode)
		{
			return EpisodeRepository.Create(episode);
		}

		public Task<Track> RegisterTrack(Track track)
		{
			return TrackRepository.Create(track);
		}

		public Task<Genre> RegisterGenre(Genre genre)
		{
			return GenreRepository.Create(genre);
		}

		public Task<Studio> RegisterStudio(Studio studio)
		{
			return StudioRepository.Create(studio);
		}

		public Task<People> RegisterPeople(People people)
		{
			return PeopleRepository.Create(people);
		}

		public Task<Library> EditLibrary(Library library, bool resetOld)
		{
			return LibraryRepository.Edit(library, resetOld);
		}

		public Task<Collection> EditCollection(Collection collection, bool resetOld)
		{
			return CollectionRepository.Edit(collection, resetOld);
		}

		public Task<Show> EditShow(Show show, bool resetOld)
		{
			return ShowRepository.Edit(show, resetOld);
		}

		public Task<Season> EditSeason(Season season, bool resetOld)
		{
			return SeasonRepository.Edit(season, resetOld);
		}

		public Task<Episode> EditEpisode(Episode episode, bool resetOld)
		{
			return EpisodeRepository.Edit(episode, resetOld);
		}

		public Task<Track> EditTrack(Track track, bool resetOld)
		{
			return TrackRepository.Edit(track, resetOld);
		}

		public Task<Genre> EditGenre(Genre genre, bool resetOld)
		{
			return GenreRepository.Edit(genre, resetOld);
		}

		public Task<Studio> EditStudio(Studio studio, bool resetOld)
		{
			return StudioRepository.Edit(studio, resetOld);
		}

		public Task<People> EditPeople(People people, bool resetOld)
		{
			return PeopleRepository.Edit(people, resetOld);
		}

		public Task DeleteLibrary(Library library)
		{
			return LibraryRepository.Delete(library);
		}

		public Task DeleteCollection(Collection collection)
		{
			return CollectionRepository.Delete(collection);
		}

		public Task DeleteShow(Show show)
		{
			return ShowRepository.Delete(show);
		}

		public Task DeleteSeason(Season season)
		{
			return SeasonRepository.Delete(season);
		}

		public Task DeleteEpisode(Episode episode)
		{
			return EpisodeRepository.Delete(episode);
		}

		public Task DeleteTrack(Track track)
		{
			return TrackRepository.Delete(track);
		}

		public Task DeleteGenre(Genre genre)
		{
			return GenreRepository.Delete(genre);
		}

		public Task DeleteStudio(Studio studio)
		{
			return StudioRepository.Delete(studio);
		}

		public Task DeletePeople(People people)
		{
			return PeopleRepository.Delete(people);
		}
		
		public Task DeleteLibrary(string library)
		{
			return LibraryRepository.Delete(library);
		}

		public Task DeleteCollection(string collection)
		{
			return CollectionRepository.Delete(collection);
		}

		public Task DeleteShow(string show)
		{
			return ShowRepository.Delete(show);
		}

		public Task DeleteSeason(string season)
		{
			return SeasonRepository.Delete(season);
		}

		public Task DeleteEpisode(string episode)
		{
			return EpisodeRepository.Delete(episode);
		}

		public Task DeleteTrack(string track)
		{
			return TrackRepository.Delete(track);
		}

		public Task DeleteGenre(string genre)
		{
			return GenreRepository.Delete(genre);
		}

		public Task DeleteStudio(string studio)
		{
			return StudioRepository.Delete(studio);
		}

		public Task DeletePeople(string people)
		{
			return PeopleRepository.Delete(people);
		}
		
		public Task DeleteLibrary(int library)
		{
			return LibraryRepository.Delete(library);
		}

		public Task DeleteCollection(int collection)
		{
			return CollectionRepository.Delete(collection);
		}

		public Task DeleteShow(int show)
		{
			return ShowRepository.Delete(show);
		}

		public Task DeleteSeason(int season)
		{
			return SeasonRepository.Delete(season);
		}

		public Task DeleteEpisode(int episode)
		{
			return EpisodeRepository.Delete(episode);
		}

		public Task DeleteTrack(int track)
		{
			return TrackRepository.Delete(track);
		}

		public Task DeleteGenre(int genre)
		{
			return GenreRepository.Delete(genre);
		}

		public Task DeleteStudio(int studio)
		{
			return StudioRepository.Delete(studio);
		}

		public Task DeletePeople(int people)
		{
			return PeopleRepository.Delete(people);
		}
	}
}
