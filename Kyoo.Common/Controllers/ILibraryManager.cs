using System.Collections.Generic;
using System.Threading.Tasks;
using JetBrains.Annotations;
using Kyoo.Models;

namespace Kyoo.Controllers
{
	public interface ILibraryManager
	{
		// Get by slug
		Task<Library> GetLibrary(string slug);
		Task<Collection> GetCollection(string slug);
		Task<Show> GetShow(string slug);
		Task<Season> GetSeason(string showSlug, int seasonNumber);
		Task<Episode> GetEpisode(string showSlug, int seasonNumber, int episodeNumber);
		Task<Episode> GetMovieEpisode(string movieSlug);
		Task<Track> GetTrack(int id);
		Task<Track> GetTrack(int episodeID, string language, bool isForced);
		Task<Genre> GetGenre(string slug);
		Task<Studio> GetStudio(string slug);
		Task<People> GetPeople(string slug);

		// Get by relations
		Task<ICollection<Season>> GetSeasons(int showID);
		Task<ICollection<Season>> GetSeasons(string showSlug);
		
		Task<ICollection<Episode>> GetEpisodes(int showID, int seasonNumber);
		Task<ICollection<Episode>> GetEpisodes(string showSlug, int seasonNumber);
		Task<ICollection<Episode>> GetEpisodes(int seasonID);
		
		
		// Helpers
		Task<Show> GetShowByPath(string path);
		Task AddShowLink(int showID, int? libraryID, int? collectionID);
		Task AddShowLink([NotNull] Show show, Library library, Collection collection);
		
		// Get all
		Task<ICollection<Library>> GetLibraries();
		Task<ICollection<Collection>> GetCollections();
		Task<ICollection<Show>> GetShows();
		Task<ICollection<Season>> GetSeasons();
		Task<ICollection<Episode>> GetEpisodes();
		Task<ICollection<Track>> GetTracks();
		Task<ICollection<Studio>> GetStudios();
		Task<ICollection<People>> GetPeoples();
		Task<ICollection<Genre>> GetGenres();
		Task<ICollection<ProviderID>> GetProviders();

		// Search
		Task<ICollection<Library>> SearchLibraries(string searchQuery);
		Task<ICollection<Collection>> SearchCollections(string searchQuery);
		Task<ICollection<Show>> SearchShows(string searchQuery);
		Task<ICollection<Season>> SearchSeasons(string searchQuery);
		Task<ICollection<Episode>> SearchEpisodes(string searchQuery);
		Task<ICollection<Genre>> SearchGenres(string searchQuery);
		Task<ICollection<Studio>> SearchStudios(string searchQuery);
		Task<ICollection<People>> SearchPeople(string searchQuery);
		
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
