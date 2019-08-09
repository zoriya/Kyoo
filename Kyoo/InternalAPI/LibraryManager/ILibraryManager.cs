using Kyoo.Models;
using System.Collections.Generic;

namespace Kyoo.InternalAPI
{
    public interface ILibraryManager
    {
        //Public value reading
        IEnumerable<Show> QueryShows(string selection);

        //Check if value exists
        bool IsShowRegistered(string showPath);
        bool IsShowRegistered(string showPath, out long showID);
        bool IsSeasonRegistered(long showID, long seasonNumber);
        bool IsSeasonRegistered(long showID, long seasonNumber, out long seasonID);
        bool IsEpisodeRegistered(string episodePath);

        //Register values
        long RegisterShow(Show show);
        long RegisterSeason(Season season);
    }
}
