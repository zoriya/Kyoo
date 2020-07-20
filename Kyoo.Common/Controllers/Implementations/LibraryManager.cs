using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Models;

namespace Kyoo.Controllers
{
	public class LibraryManager : ILibraryManager
	{
		public ILibraryRepository LibraryRepository { get; }
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

		public Task<Season> GetSeason(string showSlug, int seasonNumber)
		{
			return SeasonRepository.Get(showSlug, seasonNumber);
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
		
		public Task<Track> GetTrack(int episodeID, string language, bool isForced)
		{
			return TrackRepository.Get(episodeID, language, isForced);
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
			Pagination page = default)
		{
			return SeasonRepository.GetAll(where, sort, page);
		}

		public Task<ICollection<Episode>> GetEpisodes(Expression<Func<Episode, bool>> where = null, 
			Sort<Episode> sort = default,
			Pagination page = default)
		{
			return EpisodeRepository.GetAll(where, sort, page);
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

		public Task<ICollection<Season>> GetSeasons(int showID,
			Expression<Func<Season, bool>> where = null, 
			Sort<Season> sort = default,
			Pagination limit = default)
		{
			return SeasonRepository.GetSeasons(showID, where, sort, limit);
		}

		public Task<ICollection<Season>> GetSeasons(string showSlug,
			Expression<Func<Season, bool>> where = null, 
			Sort<Season> sort = default,
			Pagination limit = default)
		{
			return SeasonRepository.GetSeasons(showSlug, where, sort, limit);
		}

		public Task<ICollection<Episode>> GetEpisodes(int showID, int seasonNumber)
		{
			return EpisodeRepository.GetEpisodes(showID, seasonNumber);
		}

		public Task<ICollection<Episode>> GetEpisodes(string showSlug, int seasonNumber)
		{
			return EpisodeRepository.GetEpisodes(showSlug, seasonNumber);
		}

		public Task<ICollection<Episode>> GetEpisodes(int seasonID)
		{
			return EpisodeRepository.GetEpisodes(seasonID);
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

		public Task DelteLibrary(Library library)
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
		
		public Task DelteLibrary(string library)
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
		
		public Task DelteLibrary(int library)
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
