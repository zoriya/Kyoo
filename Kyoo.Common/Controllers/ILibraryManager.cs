using System.Collections.Generic;
using System.Threading.Tasks;
using Kyoo.Models;

namespace Kyoo.Controllers
{
	public interface ILibraryManager
	{
		// Get by slug
		Task<Library> GetLibrary(string slug);
		Task<Collection> GetCollection(string slug);
		Task<Show> GetShow(string slug);
		Task<Season> GetSeason(string showSlug, long seasonNumber);
		Task<Episode> GetEpisode(string showSlug, long seasonNumber, long episodeNumber);
		Task<Episode> GetMovieEpisode(string movieSlug);
		Task<Track> GetTrack(long episodeID, string language, bool isForced);
		Task<Genre> GetGenre(string slug);
		Task<Studio> GetStudio(string slug);
		Task<People> GetPeople(string slug);

		// Get all
		Task<IEnumerable<Library>> GetLibraries();
		Task<IEnumerable<Collection>> GetCollections();
		Task<IEnumerable<Show>> GetShows();
		Task<IEnumerable<Season>> GetSeasons();
		Task<IEnumerable<Episode>> GetEpisodes();
		Task<IEnumerable<Track>> GetTracks();
		Task<IEnumerable<Studio>> GetStudios();
		Task<IEnumerable<People>> GetPeoples();
		Task<IEnumerable<Genre>> GetGenres();
		Task<IEnumerable<ProviderID>> GetProviders();

		// Search
		Task<IEnumerable<Library>> SearchLibraries(string searchQuery);
		Task<IEnumerable<Collection>> SearchCollections(string searchQuery);
		Task<IEnumerable<Show>> SearchShows(string searchQuery);
		Task<IEnumerable<Season>> SearchSeasons(string searchQuery);
		Task<IEnumerable<Episode>> SearchEpisodes(string searchQuery);
		Task<IEnumerable<Genre>> SearchGenres(string searchQuery);
		Task<IEnumerable<Studio>> SearchStudios(string searchQuery);
		Task<IEnumerable<People>> SearchPeople(string searchQuery);
		
		//Register values
		Task RegisterLibrary(Library library);
		Task RegisterCollection(Collection collection);
		Task RegisterShow(Show show);
		Task RegisterSeason(Season season);
		Task RegisterEpisode(Episode episode);
		Task RegisterTrack(Track track);
		Task RegisterGenre(Genre genre);
		Task RegisterStudio(Studio studio);
		Task RegisterPeople(People people);
		
		// Edit values
		Task EditLibrary(Library library, bool resetOld);
		Task EditCollection(Collection collection, bool resetOld);
		Task EditShow(Show show, bool resetOld);
		Task EditSeason(Season season, bool resetOld);
		Task EditEpisode(Episode episode, bool resetOld);
		Task EditTrack(Track track, bool resetOld);
		Task EditGenre(Genre genre, bool resetOld);
		Task EditStudio(Studio studio, bool resetOld);
		Task EditPeople(People people, bool resetOld);

		
		// Delete values
		Task DelteLibrary(Library library);
		Task DeleteCollection(Collection collection);
		Task DeleteShow(Show show);
		Task DeleteSeason(Season season);
		Task DeleteEpisode(Episode episode);
		Task DeleteTrack(Track track);
		Task DeleteGenre(Genre genre);
		Task DeleteStudio(Studio studio);
		Task DeletePeople(People people);
	}
}
