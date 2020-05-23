using Kyoo.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Kyoo.Controllers
{
	public interface ILibraryManager
	{
		// Get by slug
		Library GetLibrary(string librarySlug);
		Collection GetCollection(string slug);
		Show GetShow(string slug);
		Season GetSeason(string showSlug, long seasonNumber);
		Episode GetEpisode(string showSlug, long seasonNumber, long episodeNumber);
		Episode GetMovieEpisode(string movieSlug);
		Genre GetGenre(string slug);
		Studio GetStudio(string slug);
		People GetPeople(string slug);
		ProviderID GetProvider(string name);

		// Get all
		IEnumerable<Library> GetLibraries();
		IEnumerable<Collection> GetCollections();
		IEnumerable<Show> GetShows();
		IEnumerable<Episode> GetEpisodes();
		IEnumerable<Track> GetTracks();
		IEnumerable<Studio> GetStudios();
		IEnumerable<People> GetPeoples();
		IEnumerable<Genre> GetGenres();

		// Search
		IEnumerable<Collection> SearchCollections(string searchQuery);
		IEnumerable<Show> SearchShows(string searchQuery);
		IEnumerable<Episode> SearchEpisodes(string searchQuery);
		IEnumerable<Genre> SearchGenres(string searchQuery);
		IEnumerable<Studio> SearchStudios(string searchQuery);
		IEnumerable<People> SearchPeople(string searchQuery);
		
		// Other get helpers
		Show GetShowByPath(string path);
		IEnumerable<string> GetLibrariesPath();
		IEnumerable<Episode> GetEpisodes(string showSlug, long seasonNumber);

		//Register values
		void Register(object obj);
		Task Edit(object obj, bool resetOld);
		void RegisterShowLinks(Library library, Collection collection, Show show);
		Task SaveChanges();
		
		// Validate values
		IEnumerable<MetadataID> Validate(IEnumerable<MetadataID> id);
		
		// Remove values
		void RemoveShow(Show show);
		void RemoveSeason(Season season);
		void RemoveEpisode(Episode episode);
	}
}
