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
		Episode GetEpisode(string showSlug, long seasonNumber, long episodeNumber);
		Episode GetMovieEpisode(string movieSlug);
		Genre GetGenre(string slug);
		Studio GetStudio(string slug);
		People GetPeople(string slug);

		// Get all
		IEnumerable<Library> GetLibraries();
		IEnumerable<Show> GetShows();
		IEnumerable<Episode> GetEpisodes();
		IEnumerable<Studio> GetStudios();
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
		void RegisterShowLinks(Library library, Collection collection, Show show);
		Task SaveChanges();
		
		// Edit values
		void Edit(Library library, bool resetOld);
		void Edit(Collection collection, bool resetOld);
		void Edit(Show show, bool resetOld);
		void Edit(Season season, bool resetOld);
		void Edit(Episode episode, bool resetOld);
		void Edit(Track track, bool resetOld);
		void Edit(People people, bool resetOld);
		void Edit(Studio studio, bool resetOld);
		void Edit(Genre genre, bool resetOld);

		// Validate values
		Library Validate(Library library);
		Collection Validate(Collection collection);
		Show Validate(Show show);
		Season Validate(Season season);
		Episode Validate(Episode episode);
		People Validate(People people);
		Studio Validate(Studio studio);
		Genre Validate(Genre genre);
		IEnumerable<MetadataID> Validate(IEnumerable<MetadataID> id);
		
		// Remove values
		void RemoveShow(Show show);
		void RemoveSeason(Season season);
		void RemoveEpisode(Episode episode);
	}
}
