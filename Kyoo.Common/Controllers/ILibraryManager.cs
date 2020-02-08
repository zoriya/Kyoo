using Kyoo.Models;
using Kyoo.Models.Watch;
using System.Collections.Generic;

namespace Kyoo.Controllers
{
    public interface ILibraryManager
    {
        //Read values
        string GetShowExternalIDs(long showID);
        Studio GetStudio(long showID);
        IEnumerable<People> GetPeople(long showID);
        IEnumerable<Genre> GetGenreForShow(long showID);
        IEnumerable<Season> GetSeasons(long showID);
        int GetSeasonCount(string showSlug, long seasonNumber);
        IEnumerable<Show> GetShowsInCollection(long collectionID);
        IEnumerable<Show> GetShowsInLibrary(long libraryID);
        IEnumerable<Show> GetShowsByPeople(long peopleID);
        IEnumerable<string> GetLibrariesPath();

        //Internal read
        (Track video, IEnumerable<Track> audios, IEnumerable<Track> subtitles) GetStreams(long episodeID, string showSlug);
        Track GetSubtitle(string showSlug, long seasonNumber, long episodeNumber, string languageTag, bool forced);

        //Public read
        IEnumerable<Show> GetShows();
        IEnumerable<Show> GetShows(string searchQuery);
        Library GetLibrary(string librarySlug);
        IEnumerable<Library> GetLibraries();
        Show GetShowBySlug(string slug);
        Season GetSeason(string showSlug, long seasonNumber);
        IEnumerable<Episode> GetEpisodes(string showSlug);
        IEnumerable<Episode> GetEpisodes(string showSlug, long seasonNumber);
        Episode GetEpisode(string showSlug, long seasonNumber, long episodeNumber);
        WatchItem GetWatchItem(string showSlug, long seasonNumber, long episodeNumber, bool complete = true);
        People GetPeopleBySlug(string slug);
        Genre GetGenreBySlug(string slug);
        Studio GetStudioBySlug(string slug);
        Collection GetCollection(string slug);
        IEnumerable<Episode> GetAllEpisodes();
        IEnumerable<Episode> SearchEpisodes(string searchQuery);
        IEnumerable<People> SearchPeople(string searchQuery);
        IEnumerable<Genre> SearchGenres(string searchQuery);
        IEnumerable<Studio> SearchStudios(string searchQuery);

        //Check if value exists
        bool IsCollectionRegistered(string collectionSlug, out long collectionID);
        bool IsShowRegistered(string showPath, out long showID);
        bool IsSeasonRegistered(long showID, long seasonNumber, out long seasonID);
        bool IsEpisodeRegistered(string episodePath, out long episodeID);

        //Register values
        long RegisterCollection(Collection collection);
        long RegisterShow(Show show);
        long RegisterSeason(Season season);
        long RegisterEpisode(Episode episode);
        long RegisterTrack(Track track);
        void RegisterShowLinks(Library library, Collection collection, Show show);

        void RemoveShow(long showID);
        void RemoveSeason(long seasonID);
        void RemoveEpisode(long episodeID);
        void ClearSubtitles(long episodeID);
    }
}
