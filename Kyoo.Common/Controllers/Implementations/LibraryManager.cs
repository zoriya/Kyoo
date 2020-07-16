using System;
using System.Collections.Generic;
using System.Linq.Expressions;
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
		
		public LibraryManager(ILibraryRepository libraries, 
			ICollectionRepository collections, 
			IShowRepository shows, 
			ISeasonRepository seasons, 
			IEpisodeRepository episodes,
			ITrackRepository tracks, 
			IGenreRepository genres, 
			IStudioRepository studios,
			IProviderRepository providers, 
			IPeopleRepository people)
		{
			_libraries = libraries;
			_collections = collections;
			_shows = shows;
			_seasons = seasons;
			_episodes = episodes;
			_tracks = tracks;
			_genres = genres;
			_studios = studios;
			_providers = providers;
			_people = people;
		}
		
		public void Dispose()
		{
			_libraries.Dispose();
			_collections.Dispose();
			_shows.Dispose();
			_seasons.Dispose();
			_episodes.Dispose();
			_tracks.Dispose();
			_genres.Dispose();
			_studios.Dispose();
			_people.Dispose();
			_providers.Dispose();
		}
		
		public async ValueTask DisposeAsync()
		{
			await Task.WhenAll(
				_libraries.DisposeAsync().AsTask(),
				_collections.DisposeAsync().AsTask(),
				_shows.DisposeAsync().AsTask(),
				_seasons.DisposeAsync().AsTask(),
				_episodes.DisposeAsync().AsTask(),
				_tracks.DisposeAsync().AsTask(),
				_genres.DisposeAsync().AsTask(),
				_studios.DisposeAsync().AsTask(),
				_people.DisposeAsync().AsTask(),
				_providers.DisposeAsync().AsTask()
			);
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

		public Task<Season> GetSeason(string showSlug, int seasonNumber)
		{
			return _seasons.Get(showSlug, seasonNumber);
		}

		public Task<Episode> GetEpisode(string showSlug, int seasonNumber, int episodeNumber)
		{
			return _episodes.Get(showSlug, seasonNumber, episodeNumber);
		}

		public Task<Episode> GetMovieEpisode(string movieSlug)
		{
			return _episodes.Get(movieSlug);
		}

		public Task<Track> GetTrack(int id)
		{
			return _tracks.Get(id);
		}
		
		public Task<Track> GetTrack(int episodeID, string language, bool isForced)
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

		public Task<ICollection<Library>> GetLibraries(Expression<Func<Library, bool>> where = null, 
			Sort<Library> sort = default,
			Pagination page = default)
		{
			return _libraries.GetAll(where, sort, page);
		}

		public Task<ICollection<Collection>> GetCollections(Expression<Func<Collection, bool>> where = null, 
			Sort<Collection> sort = default,
			Pagination page = default)
		{
			return _collections.GetAll(where, sort, page);
		}

		public Task<ICollection<Show>> GetShows(Expression<Func<Show, bool>> where = null, 
			Sort<Show> sort = default,
			Pagination page = default)
		{
			return _shows.GetAll(where, sort, page);
		}

		public Task<ICollection<Season>> GetSeasons(Expression<Func<Season, bool>> where = null, 
			Sort<Season> sort = default,
			Pagination page = default)
		{
			return _seasons.GetAll(where, sort, page);
		}

		public Task<ICollection<Episode>> GetEpisodes(Expression<Func<Episode, bool>> where = null, 
			Sort<Episode> sort = default,
			Pagination page = default)
		{
			return _episodes.GetAll(where, sort, page);
		}

		public Task<ICollection<Track>> GetTracks(Expression<Func<Track, bool>> where = null, 
			Sort<Track> sort = default,
			Pagination page = default)
		{
			return _tracks.GetAll(where, sort, page);
		}

		public Task<ICollection<Studio>> GetStudios(Expression<Func<Studio, bool>> where = null, 
			Sort<Studio> sort = default,
			Pagination page = default)
		{
			return _studios.GetAll(where, sort, page);
		}

		public Task<ICollection<People>> GetPeople(Expression<Func<People, bool>> where = null, 
			Sort<People> sort = default,
			Pagination page = default)
		{
			return _people.GetAll(where, sort, page);
		}

		public Task<ICollection<Genre>> GetGenres(Expression<Func<Genre, bool>> where = null, 
			Sort<Genre> sort = default,
			Pagination page = default)
		{
			return _genres.GetAll(where, sort, page);
		}

		public Task<ICollection<ProviderID>> GetProviders(Expression<Func<ProviderID, bool>> where = null, 
			Sort<ProviderID> sort = default,
			Pagination page = default)
		{
			return _providers.GetAll(where, sort, page); 
		}

		public Task<ICollection<Season>> GetSeasons(int showID)
		{
			return _seasons.GetSeasons(showID);
		}

		public Task<ICollection<Season>> GetSeasons(string showSlug)
		{
			return _seasons.GetSeasons(showSlug);
		}

		public Task<ICollection<Episode>> GetEpisodes(int showID, int seasonNumber)
		{
			return _episodes.GetEpisodes(showID, seasonNumber);
		}

		public Task<ICollection<Episode>> GetEpisodes(string showSlug, int seasonNumber)
		{
			return _episodes.GetEpisodes(showSlug, seasonNumber);
		}

		public Task<ICollection<Episode>> GetEpisodes(int seasonID)
		{
			return _episodes.GetEpisodes(seasonID);
		}
		
		public Task AddShowLink(int showID, int? libraryID, int? collectionID)
		{
			return _shows.AddShowLink(showID, libraryID, collectionID);
		}

		public Task AddShowLink(Show show, Library library, Collection collection)
		{
			if (show == null)
				throw new ArgumentNullException(nameof(show));
			return AddShowLink(show.ID, library?.ID, collection?.ID);
		}
		
		public Task<ICollection<Library>> SearchLibraries(string searchQuery)
		{
			return _libraries.Search(searchQuery);
		}

		public Task<ICollection<Collection>> SearchCollections(string searchQuery)
		{
			return _collections.Search(searchQuery);
		}

		public Task<ICollection<Show>> SearchShows(string searchQuery)
		{
			return _shows.Search(searchQuery);
		}

		public Task<ICollection<Season>> SearchSeasons(string searchQuery)
		{
			return _seasons.Search(searchQuery);
		}

		public Task<ICollection<Episode>> SearchEpisodes(string searchQuery)
		{
			return _episodes.Search(searchQuery);
		}

		public Task<ICollection<Genre>> SearchGenres(string searchQuery)
		{
			return _genres.Search(searchQuery);
		}

		public Task<ICollection<Studio>> SearchStudios(string searchQuery)
		{
			return _studios.Search(searchQuery);
		}

		public Task<ICollection<People>> SearchPeople(string searchQuery)
		{
			return _people.Search(searchQuery);
		}
		
		public Task<Library> RegisterLibrary(Library library)
		{
			return _libraries.Create(library);
		}

		public Task<Collection> RegisterCollection(Collection collection)
		{
			return _collections.Create(collection);
		}

		public Task<Show> RegisterShow(Show show)
		{
			return _shows.Create(show);
		}

		public Task<Season> RegisterSeason(Season season)
		{
			return _seasons.Create(season);
		}

		public Task<Episode> RegisterEpisode(Episode episode)
		{
			return _episodes.Create(episode);
		}

		public Task<Track> RegisterTrack(Track track)
		{
			return _tracks.Create(track);
		}

		public Task<Genre> RegisterGenre(Genre genre)
		{
			return _genres.Create(genre);
		}

		public Task<Studio> RegisterStudio(Studio studio)
		{
			return _studios.Create(studio);
		}

		public Task<People> RegisterPeople(People people)
		{
			return _people.Create(people);
		}

		public Task<Library> EditLibrary(Library library, bool resetOld)
		{
			return _libraries.Edit(library, resetOld);
		}

		public Task<Collection> EditCollection(Collection collection, bool resetOld)
		{
			return _collections.Edit(collection, resetOld);
		}

		public Task<Show> EditShow(Show show, bool resetOld)
		{
			return _shows.Edit(show, resetOld);
		}

		public Task<Season> EditSeason(Season season, bool resetOld)
		{
			return _seasons.Edit(season, resetOld);
		}

		public Task<Episode> EditEpisode(Episode episode, bool resetOld)
		{
			return _episodes.Edit(episode, resetOld);
		}

		public Task<Track> EditTrack(Track track, bool resetOld)
		{
			return _tracks.Edit(track, resetOld);
		}

		public Task<Genre> EditGenre(Genre genre, bool resetOld)
		{
			return _genres.Edit(genre, resetOld);
		}

		public Task<Studio> EditStudio(Studio studio, bool resetOld)
		{
			return _studios.Edit(studio, resetOld);
		}

		public Task<People> EditPeople(People people, bool resetOld)
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
		
		public Task DelteLibrary(string library)
		{
			return _libraries.Delete(library);
		}

		public Task DeleteCollection(string collection)
		{
			return _collections.Delete(collection);
		}

		public Task DeleteShow(string show)
		{
			return _shows.Delete(show);
		}

		public Task DeleteSeason(string season)
		{
			return _seasons.Delete(season);
		}

		public Task DeleteEpisode(string episode)
		{
			return _episodes.Delete(episode);
		}

		public Task DeleteTrack(string track)
		{
			return _tracks.Delete(track);
		}

		public Task DeleteGenre(string genre)
		{
			return _genres.Delete(genre);
		}

		public Task DeleteStudio(string studio)
		{
			return _studios.Delete(studio);
		}

		public Task DeletePeople(string people)
		{
			return _people.Delete(people);
		}
		
		public Task DelteLibrary(int library)
		{
			return _libraries.Delete(library);
		}

		public Task DeleteCollection(int collection)
		{
			return _collections.Delete(collection);
		}

		public Task DeleteShow(int show)
		{
			return _shows.Delete(show);
		}

		public Task DeleteSeason(int season)
		{
			return _seasons.Delete(season);
		}

		public Task DeleteEpisode(int episode)
		{
			return _episodes.Delete(episode);
		}

		public Task DeleteTrack(int track)
		{
			return _tracks.Delete(track);
		}

		public Task DeleteGenre(int genre)
		{
			return _genres.Delete(genre);
		}

		public Task DeleteStudio(int studio)
		{
			return _studios.Delete(studio);
		}

		public Task DeletePeople(int people)
		{
			return _people.Delete(people);
		}
	}
}
