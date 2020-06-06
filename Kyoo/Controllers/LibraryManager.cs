using System.Collections.Generic;
using System.Threading.Tasks;
using Kyoo.Models;

namespace Kyoo.Controllers
{
	public class LibraryManager : ILibraryManager
	{
		private readonly ILibraryRepository _libraries;
		private readonly ICollectionRepository _collections;
		private readonly IShowRepository _shows;
		private readonly ISeasonRepository _seasons;
		private readonly IEpisodeRepository _episodes;
		private readonly ITrackRepository _tracks;
		private readonly IGenreRepository _genres;
		private readonly IStudioRepository _studios;
		private readonly IPeopleRepository _people;
		private readonly IProviderRepository _providers;
		
		public LibraryManager(DatabaseContext database)
		{
			_providers = new ProviderRepository(database);
			_libraries = new LibraryRepository(database, _providers);
			_collections = new CollectionRepository(database);
			_genres = new GenreRepository(database);
			_people = new PeopleRepository(database, _providers);
			_studios = new StudioRepository(database);
			_shows = new ShowRepository(database, _genres, _people, _studios, _providers);
			_seasons = new SeasonRepository(database, _providers);
			_episodes = new EpisodeRepository(database, _providers);
			_tracks = new TrackRepository(database);
		}

		public Task<Library> GetLibrary(string slug)
		{
			return _libraries.Get(slug);
		}

		public Task<Collection> GetCollection(string slug)
		{
			return _collections.Get(slug);
		}

		public Task<Show> GetShow(string slug)
		{
			return _shows.Get(slug);
		}

		public Task<Season> GetSeason(string showSlug, long seasonNumber)
		{
			return _seasons.Get(showSlug, seasonNumber);
		}

		public Task<Episode> GetEpisode(string showSlug, long seasonNumber, long episodeNumber)
		{
			return _episodes.Get(showSlug, seasonNumber, episodeNumber);
		}

		public Task<Episode> GetMovieEpisode(string movieSlug)
		{
			return _episodes.Get(movieSlug);
		}

		public Task<Track> GetTrack(long id)
		{
			return _tracks.Get(id);
		}
		
		public Task<Track> GetTrack(long episodeID, string language, bool isForced)
		{
			return _tracks.Get(episodeID, language, isForced);
		}

		public Task<Genre> GetGenre(string slug)
		{
			return _genres.Get(slug);
		}

		public Task<Studio> GetStudio(string slug)
		{
			return _studios.Get(slug);
		}

		public Task<People> GetPeople(string slug)
		{
			return _people.Get(slug);
		}

		public Task<IEnumerable<Library>> GetLibraries()
		{
			return _libraries.GetAll();
		}

		public Task<IEnumerable<Collection>> GetCollections()
		{
			return _collections.GetAll();
		}

		public Task<IEnumerable<Show>> GetShows()
		{
			return _shows.GetAll();
		}

		public Task<IEnumerable<Season>> GetSeasons()
		{
			return _seasons.GetAll();
		}

		public Task<IEnumerable<Episode>> GetEpisodes()
		{
			return _episodes.GetAll();
		}

		public Task<IEnumerable<Track>> GetTracks()
		{
			return _tracks.GetAll();
		}

		public Task<IEnumerable<Studio>> GetStudios()
		{
			return _studios.GetAll();
		}

		public Task<IEnumerable<People>> GetPeoples()
		{
			return _people.GetAll();
		}

		public Task<IEnumerable<Genre>> GetGenres()
		{
			return _genres.GetAll();
		}

		public Task<IEnumerable<ProviderID>> GetProviders()
		{
			return _providers.GetAll();
		}

		public Task<IEnumerable<Season>> GetSeasons(long showID)
		{
			return _seasons.GetSeasons(showID);
		}

		public Task<IEnumerable<Season>> GetSeasons(string showSlug)
		{
			return _seasons.GetSeasons(showSlug);
		}

		public Task<IEnumerable<Episode>> GetEpisodes(long showID, long seasonNumber)
		{
			return _episodes.GetEpisodes(showID, seasonNumber);
		}

		public Task<IEnumerable<Episode>> GetEpisodes(string showSlug, long seasonNumber)
		{
			return _episodes.GetEpisodes(showSlug, seasonNumber);
		}

		public Task<IEnumerable<Episode>> GetEpisodes(long seasonID)
		{
			return _episodes.GetEpisodes(seasonID);
		}

		public Task<IEnumerable<Library>> SearchLibraries(string searchQuery)
		{
			return _libraries.Search(searchQuery);
		}

		public Task<IEnumerable<Collection>> SearchCollections(string searchQuery)
		{
			return _collections.Search(searchQuery);
		}

		public Task<IEnumerable<Show>> SearchShows(string searchQuery)
		{
			return _shows.Search(searchQuery);
		}

		public Task<IEnumerable<Season>> SearchSeasons(string searchQuery)
		{
			return _seasons.Search(searchQuery);
		}

		public Task<IEnumerable<Episode>> SearchEpisodes(string searchQuery)
		{
			return _episodes.Search(searchQuery);
		}

		public Task<IEnumerable<Genre>> SearchGenres(string searchQuery)
		{
			return _genres.Search(searchQuery);
		}

		public Task<IEnumerable<Studio>> SearchStudios(string searchQuery)
		{
			return _studios.Search(searchQuery);
		}

		public Task<IEnumerable<People>> SearchPeople(string searchQuery)
		{
			return _people.Search(searchQuery);
		}
		
		public Task RegisterLibrary(Library library)
		{
			return _libraries.Create(library);
		}

		public Task RegisterCollection(Collection collection)
		{
			return _collections.Create(collection);
		}

		public Task RegisterShow(Show show)
		{
			return _shows.Create(show);
		}

		public Task RegisterSeason(Season season)
		{
			return _seasons.Create(season);
		}

		public Task RegisterEpisode(Episode episode)
		{
			return _episodes.Create(episode);
		}

		public Task RegisterTrack(Track track)
		{
			return _tracks.Create(track);
		}

		public Task RegisterGenre(Genre genre)
		{
			return _genres.Create(genre);
		}

		public Task RegisterStudio(Studio studio)
		{
			return _studios.Create(studio);
		}

		public Task RegisterPeople(People people)
		{
			return _people.Create(people);
		}

		public Task EditLibrary(Library library, bool resetOld)
		{
			return _libraries.Edit(library, resetOld);
		}

		public Task EditCollection(Collection collection, bool resetOld)
		{
			return _collections.Edit(collection, resetOld);
		}

		public Task EditShow(Show show, bool resetOld)
		{
			return _shows.Edit(show, resetOld);
		}

		public Task EditSeason(Season season, bool resetOld)
		{
			return _seasons.Edit(season, resetOld);
		}

		public Task EditEpisode(Episode episode, bool resetOld)
		{
			return _episodes.Edit(episode, resetOld);
		}

		public Task EditTrack(Track track, bool resetOld)
		{
			return _tracks.Edit(track, resetOld);
		}

		public Task EditGenre(Genre genre, bool resetOld)
		{
			return _genres.Edit(genre, resetOld);
		}

		public Task EditStudio(Studio studio, bool resetOld)
		{
			return _studios.Edit(studio, resetOld);
		}

		public Task EditPeople(People people, bool resetOld)
		{
			return _people.Edit(people, resetOld);
		}

		public Task DelteLibrary(Library library)
		{
			return _libraries.Delete(library);
		}

		public Task DeleteCollection(Collection collection)
		{
			return _collections.Delete(collection);
		}

		public Task DeleteShow(Show show)
		{
			return _shows.Delete(show);
		}

		public Task DeleteSeason(Season season)
		{
			return _seasons.Delete(season);
		}

		public Task DeleteEpisode(Episode episode)
		{
			return _episodes.Delete(episode);
		}

		public Task DeleteTrack(Track track)
		{
			return _tracks.Delete(track);
		}

		public Task DeleteGenre(Genre genre)
		{
			return _genres.Delete(genre);
		}

		public Task DeleteStudio(Studio studio)
		{
			return _studios.Delete(studio);
		}

		public Task DeletePeople(People people)
		{
			return _people.Delete(people);
		}
	}
}
