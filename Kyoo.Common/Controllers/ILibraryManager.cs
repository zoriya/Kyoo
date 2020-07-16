using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using JetBrains.Annotations;
using Kyoo.Models;

namespace Kyoo.Controllers
{
	public interface ILibraryManager : IDisposable, IAsyncDisposable
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
		Task AddShowLink(int showID, int? libraryID, int? collectionID);
		Task AddShowLink([NotNull] Show show, Library library, Collection collection);
		
		// Get all
		Task<ICollection<Library>> GetLibraries(Expression<Func<Library, bool>> where = null, 
			Sort<Library> sort = default,
			Pagination page = default);
		Task<ICollection<Collection>> GetCollections(Expression<Func<Collection, bool>> where = null, 
			Sort<Collection> sort = default,
			Pagination page = default);
		Task<ICollection<Show>> GetShows(Expression<Func<Show, bool>> where = null, 
			Sort<Show> sort = default,
			Pagination page = default);
		Task<ICollection<Season>> GetSeasons(Expression<Func<Season, bool>> where = null, 
			Sort<Season> sort = default,
			Pagination page = default);
		Task<ICollection<Episode>> GetEpisodes(Expression<Func<Episode, bool>> where = null, 
			Sort<Episode> sort = default,
			Pagination page = default);
		Task<ICollection<Track>> GetTracks(Expression<Func<Track, bool>> where = null, 
			Sort<Track> sort = default,
			Pagination page = default);
		Task<ICollection<Studio>> GetStudios(Expression<Func<Studio, bool>> where = null, 
			Sort<Studio> sort = default,
			Pagination page = default);
		Task<ICollection<People>> GetPeople(Expression<Func<People, bool>> where = null, 
			Sort<People> sort = default,
			Pagination page = default);
		Task<ICollection<Genre>> GetGenres(Expression<Func<Genre, bool>> where = null, 
			Sort<Genre> sort = default,
			Pagination page = default);
		Task<ICollection<ProviderID>> GetProviders(Expression<Func<ProviderID, bool>> where = null, 
			Sort<ProviderID> sort = default,
			Pagination page = default);
		
		Task<ICollection<Library>> GetLibraries([Optional] Expression<Func<Library, bool>> where,
			Expression<Func<Library, object>> sort,
			Pagination page = default
		) => GetLibraries(where, new Sort<Library>(sort), page);
		Task<ICollection<Collection>> GetCollections([Optional] Expression<Func<Collection, bool>> where,
			Expression<Func<Collection, object>> sort,
			Pagination page = default
		) => GetCollections(where, new Sort<Collection>(sort), page);
		Task<ICollection<Show>> GetShows([Optional] Expression<Func<Show, bool>> where,
			Expression<Func<Show, object>> sort,
			Pagination page = default
		) => GetShows(where, new Sort<Show>(sort), page);
		Task<ICollection<Season>> GetSeasons([Optional] Expression<Func<Season, bool>> where,
			Expression<Func<Season, object>> sort,
			Pagination page = default
		) => GetSeasons(where, new Sort<Season>(sort), page);
		Task<ICollection<Episode>> GetEpisodes([Optional] Expression<Func<Episode, bool>> where,
			Expression<Func<Episode, object>> sort,
			Pagination page = default
		) => GetEpisodes(where, new Sort<Episode>(sort), page);
		Task<ICollection<Track>> GetTracks([Optional] Expression<Func<Track, bool>> where,
			Expression<Func<Track, object>> sort,
			Pagination page = default
		) => GetTracks(where, new Sort<Track>(sort), page);
		Task<ICollection<Studio>> GetStudios([Optional] Expression<Func<Studio, bool>> where,
			Expression<Func<Studio, object>> sort,
			Pagination page = default
		) => GetStudios(where, new Sort<Studio>(sort), page);
		Task<ICollection<People>> GetPeople([Optional] Expression<Func<People, bool>> where,
			Expression<Func<People, object>> sort,
			Pagination page = default
		) => GetPeople(where, new Sort<People>(sort), page);
		Task<ICollection<Genre>> GetGenres([Optional] Expression<Func<Genre, bool>> where,
			Expression<Func<Genre, object>> sort,
			Pagination page = default
		) => GetGenres(where, new Sort<Genre>(sort), page);
		Task<ICollection<ProviderID>> GetProviders([Optional] Expression<Func<ProviderID, bool>> where,
			Expression<Func<ProviderID, object>> sort,
			Pagination page = default
		) => GetProviders(where, new Sort<ProviderID>(sort), page);


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
		Task<Library> RegisterLibrary(Library library);
		Task<Collection> RegisterCollection(Collection collection);
		Task<Show> RegisterShow(Show show);
		Task<Season> RegisterSeason(Season season);
		Task<Episode> RegisterEpisode(Episode episode);
		Task<Track> RegisterTrack(Track track);
		Task<Genre> RegisterGenre(Genre genre);
		Task<Studio> RegisterStudio(Studio studio);
		Task<People> RegisterPeople(People people);
		
		// Edit values
		Task<Library> EditLibrary(Library library, bool resetOld);
		Task<Collection> EditCollection(Collection collection, bool resetOld);
		Task<Show> EditShow(Show show, bool resetOld);
		Task<Season> EditSeason(Season season, bool resetOld);
		Task<Episode> EditEpisode(Episode episode, bool resetOld);
		Task<Track> EditTrack(Track track, bool resetOld);
		Task<Genre> EditGenre(Genre genre, bool resetOld);
		Task<Studio> EditStudio(Studio studio, bool resetOld);
		Task<People> EditPeople(People people, bool resetOld);

		
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
		
		//Delete by slug
		Task DelteLibrary(string slug);
		Task DeleteCollection(string slug);
		Task DeleteShow(string slug);
		Task DeleteSeason(string slug);
		Task DeleteEpisode(string slug);
		Task DeleteTrack(string slug);
		Task DeleteGenre(string slug);
		Task DeleteStudio(string slug);
		Task DeletePeople(string slug);
		
		//Delete by id
		Task DelteLibrary(int id);
		Task DeleteCollection(int id);
		Task DeleteShow(int id);
		Task DeleteSeason(int id);
		Task DeleteEpisode(int id);
		Task DeleteTrack(int id);
		Task DeleteGenre(int id);
		Task DeleteStudio(int id);
		Task DeletePeople(int id);
	}
}
