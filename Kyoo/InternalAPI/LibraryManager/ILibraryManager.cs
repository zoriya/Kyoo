using Kyoo.Models;
using System.Collections.Generic;

namespace Kyoo.InternalAPI
{
    public interface ILibraryManager
    {
        //Read values
        IEnumerable<Show> QueryShows(string selection);

        //Check if value exists
        bool IsEpisodeRegistered(string episodePath);
        bool IsShowRegistered(string showPath);
        bool IsShowRegistered(string showPath, out long? showID);

        //Register values
        long RegisterShow(Show show);
    }
}
