using System.Collections.Generic;
using Kyoo.Models;

namespace Kyoo.Controllers
{
	public interface ILibraryManager
	{
		// Get by slug
		Library GetLibrary(string slug);
		Collection GetCollection(string slug);
		Show GetShow(string slug);
		Season GetSeason(string showSlug, long seasonNumber);
		Episode GetEpisode(string showSlug, long seasonNumber, long episodeNumber);
		Episode GetMovieEpisode(string movieSlug);
		Track GetTrack(string slug);
		Genre GetGenre(string slug);
		Studio GetStudio(string slug);
		People GetPeople(string slug);

		// Get all
		IEnumerable<Library> GetLibraries();
		IEnumerable<Collection> GetCollections();
		IEnumerable<Show> GetShows();
		IEnumerable<Season> GetSeasons();
		IEnumerable<Episode> GetEpisodes();
		IEnumerable<Track> GetTracks();
		IEnumerable<Studio> GetStudios();
		IEnumerable<People> GetPeoples();
		IEnumerable<Genre> GetGenres();

		// Search
		IEnumerable<Library> SearchLibraries(string searchQuery);
		IEnumerable<Collection> SearchCollections(string searchQuery);
		IEnumerable<Show> SearchShows(string searchQuery);
		IEnumerable<Season> SearchSeasons(string searchQuery);
		IEnumerable<Episode> SearchEpisodes(string searchQuery);
		IEnumerable<Genre> SearchGenres(string searchQuery);
		IEnumerable<Studio> SearchStudios(string searchQuery);
		IEnumerable<People> SearchPeople(string searchQuery);
		
		//Register values
		void RegisterLibrary(Library library);
		void RegisterCollection(Collection collection);
		void RegisterShow(Show show);
		void RegisterSeason(Season season);
		void RegisterEpisode(Episode episode);
		void RegisterTrack(Track track);
		void RegisterGenre(Genre genre);
		void RegisterStudio(Studio studio);
		void RegisterPeople(People people);
		
		// Edit values
		void EditLibrary(Library library, bool resetOld);
		void EditCollection(Collection collection, bool resetOld);
		void EditShow(Show show, bool resetOld);
		void EditSeason(Season season, bool resetOld);
		void EditEpisode(Episode episode, bool resetOld);
		void EditTrack(Track track, bool resetOld);
		void EditGenre(Genre genre, bool resetOld);
		void EditStudio(Studio studio, bool resetOld);
		void EditPeople(People people, bool resetOld);

		
		// Delete values
		void DelteLibrary(Library library);
		void DeleteCollection(Collection collection);
		void DeleteShow(Show show);
		void DeleteSeason(Season season);
		void DeleteEpisode(Episode episode);
		void DeleteTrack(Track track);
		void DeleteGenre(Genre genre);
		void DeleteStudio(Studio studio);
		void DeletePeople(People people);
	}
}
