using Kyoo.Models;
using Kyoo.Models.Watch;
using System.Collections.Generic;

namespace Kyoo.InternalAPI
{
    public interface ILibraryManager
    {
        //Read values
        string GetShowExternalIDs(long showID);
        IEnumerable<Show> QueryShows(string selection);
        Studio GetStudio(long showID);
        List<People> GetDirectors(long showID);
        List<People> GetPeople(long showID);
        List<Genre> GetGenreForShow(long showID);
        List<Season> GetSeasons(long showID);
        int GetSeasonCount(string showSlug, long seasonNumber);

        //Internal HTML read
        (List<Track> audios, List<Track> subtitles) GetStreams(long episodeID);
        Track GetSubtitle(string showSlug, long seasonNumber, long episodeNumber, string languageTag);

        //Public read
        IEnumerable<Library> GetLibraries();
        Show GetShowBySlug(string slug);
        Season GetSeason(string showSlug, long seasonNumber);
        List<Episode> GetEpisodes(string showSlug, long seasonNumber);
        Episode GetEpisode(string showSlug, long seasonNumber, long episodeNumber);
        WatchItem GetWatchItem(string showSlug, long seasonNumber, long episodeNumber, bool complete = true);
        People GetPeopleBySlug(string slug);
        Genre GetGenreBySlug(string slug);
        Studio GetStudioBySlug(string slug);

        //Check if value exists
        bool IsShowRegistered(string showPath);
        bool IsShowRegistered(string showPath, out long showID);
        bool IsSeasonRegistered(long showID, long seasonNumber);
        bool IsSeasonRegistered(long showID, long seasonNumber, out long seasonID);
        bool IsEpisodeRegistered(string episodePath);

        //Register values
        long RegisterShow(Show show);
        long RegisterSeason(Season season);
        long RegisterEpisode(Episode episode);
        void RegisterTrack(Track track);

        long GetOrCreateGenre(Genre genre);
        long GetOrCreateStudio(Studio studio);

        void RegisterShowPeople(long showID, List<People> actors);
    }
}
