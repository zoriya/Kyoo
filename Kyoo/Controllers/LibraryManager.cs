using System.Collections.Generic;
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
		
		public LibraryManager(ILibraryRepository libraries,
			ICollectionRepository collections,
			IShowRepository shows,
			ISeasonRepository seasons,
			IEpisodeRepository episodes,
			ITrackRepository tracks,
			IGenreRepository genres,
			IStudioRepository studios,
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
			_people = people;
		}

		public Library GetLibrary(string slug)
		{
			return _libraries.Get(slug);
		}

		public Collection GetCollection(string slug)
		{
			return _collections.Get(slug);
		}

		public Show GetShow(string slug)
		{
			return _shows.Get(slug);
		}

		public Season GetSeason(string showSlug, long seasonNumber)
		{
			return _seasons.Get(showSlug, seasonNumber);
		}

		public Episode GetEpisode(string showSlug, long seasonNumber, long episodeNumber)
		{
			return _episodes.Get(showSlug, seasonNumber, episodeNumber);
		}

		public Episode GetMovieEpisode(string movieSlug)
		{
			return _episodes.Get(movieSlug);
		}

		public Track GetTrack(string slug)
		{
			return _tracks.Get(slug);
		}

		public Genre GetGenre(string slug)
		{
			return _genres.Get(slug);
		}

		public Studio GetStudio(string slug)
		{
			return _studios.Get(slug);
		}

		public People GetPeople(string slug)
		{
			return _people.Get(slug);
		}

		public IEnumerable<Library> GetLibraries()
		{
			return _libraries.GetAll();
		}

		public IEnumerable<Collection> GetCollections()
		{
			return _collections.GetAll();
		}

		public IEnumerable<Show> GetShows()
		{
			return _shows.GetAll();
		}

		public IEnumerable<Season> GetSeasons()
		{
			return _seasons.GetAll();
		}

		public IEnumerable<Episode> GetEpisodes()
		{
			return _episodes.GetAll();
		}

		public IEnumerable<Track> GetTracks()
		{
			return _tracks.GetAll();
		}

		public IEnumerable<Studio> GetStudios()
		{
			return _studios.GetAll();
		}

		public IEnumerable<People> GetPeoples()
		{
			return _people.GetAll();
		}

		public IEnumerable<Genre> GetGenres()
		{
			return _genres.GetAll();
		}

		public IEnumerable<Library> SearchLibraries(string searchQuery)
		{
			return _libraries.Search(searchQuery);
		}

		public IEnumerable<Collection> SearchCollections(string searchQuery)
		{
			return _collections.Search(searchQuery);
		}

		public IEnumerable<Show> SearchShows(string searchQuery)
		{
			return _shows.Search(searchQuery);
		}

		public IEnumerable<Season> SearchSeasons(string searchQuery)
		{
			return _seasons.Search(searchQuery);
		}

		public IEnumerable<Episode> SearchEpisodes(string searchQuery)
		{
			return _episodes.Search(searchQuery);
		}

		public IEnumerable<Genre> SearchGenres(string searchQuery)
		{
			return _genres.Search(searchQuery);
		}

		public IEnumerable<Studio> SearchStudios(string searchQuery)
		{
			return _studios.Search(searchQuery);
		}

		public IEnumerable<People> SearchPeople(string searchQuery)
		{
			return _people.Search(searchQuery);
		}
		
		public void RegisterLibrary(Library library)
		{
			_libraries.Create(library);
		}

		public void RegisterCollection(Collection collection)
		{
			_collections.Create(collection);
		}

		public void RegisterShow(Show show)
		{
			_shows.Create(show);
		}

		public void RegisterSeason(Season season)
		{
			_seasons.Create(season);
		}

		public void RegisterEpisode(Episode episode)
		{
			_episodes.Create(episode);
		}

		public void RegisterTrack(Track track)
		{
			_tracks.Create(track);
		}

		public void RegisterGenre(Genre genre)
		{
			_genres.Create(genre);

		}

		public void RegisterStudio(Studio studio)
		{
			_studios.Create(studio);
		}

		public void RegisterPeople(People people)
		{
			_people.Create(people);
		}

		public void EditLibrary(Library library, bool resetOld)
		{
			_libraries.Edit(library, resetOld);
		}

		public void EditCollection(Collection collection, bool resetOld)
		{
			throw new System.NotImplementedException();
		}

		public void EditShow(Show show, bool resetOld)
		{
			throw new System.NotImplementedException();
		}

		public void EditSeason(Season season, bool resetOld)
		{
			throw new System.NotImplementedException();
		}

		public void EditEpisode(Episode episode, bool resetOld)
		{
			throw new System.NotImplementedException();
		}

		public void EditTrack(Track track, bool resetOld)
		{
			throw new System.NotImplementedException();
		}

		public void EditGenre(Genre genre, bool resetOld)
		{
			throw new System.NotImplementedException();
		}

		public void EditStudio(Studio studio, bool resetOld)
		{
			throw new System.NotImplementedException();
		}

		public void EditPeople(People people, bool resetOld)
		{
			throw new System.NotImplementedException();
		}

		public void DelteLibrary(Library library)
		{
			throw new System.NotImplementedException();
		}

		public void DeleteCollection(Collection collection)
		{
			throw new System.NotImplementedException();
		}

		public void DeleteShow(Show show)
		{
			throw new System.NotImplementedException();
		}

		public void DeleteSeason(Season season)
		{
			throw new System.NotImplementedException();
		}

		public void DeleteEpisode(Episode episode)
		{
			throw new System.NotImplementedException();
		}

		public void DeleteTrack(Track track)
		{
			throw new System.NotImplementedException();
		}

		public void DeleteGenre(Genre genre)
		{
			throw new System.NotImplementedException();
		}

		public void DeleteStudio(Studio studio)
		{
			throw new System.NotImplementedException();
		}

		public void DeletePeople(People people)
		{
			throw new System.NotImplementedException();
		}
	}
}
