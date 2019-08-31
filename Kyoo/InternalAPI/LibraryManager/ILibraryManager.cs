using Kyoo.Models;
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

        //Public read
        IEnumerable<Library> GetLibraries();
        Show GetShowBySlug(string slug);
        Season GetSeason(string showSlug, long seasonNumber);
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

        long GetOrCreateGenre(Genre genre);
        long GetOrCreateStudio(Studio studio);

        void RegisterShowPeople(long showID, List<People> actors);
    }
}
