using Kyoo.Models;
using System.Collections.Generic;

namespace Kyoo.InternalAPI
{
    public interface ILibraryManager
    {
        //Read values
        string GetShowExternalIDs(long showID);
        IEnumerable<Show> QueryShows(string selection);
        List<People> GetPeople(long showID);

        //Public read
        IEnumerable<Library> GetLibraries();
        Show GetShowBySlug(string slug);

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

        void RegisterShowPeople(long showID, List<People> actors);
    }
}
