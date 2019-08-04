using Kyoo.Models;
using System.Collections.Generic;

namespace Kyoo.InternalAPI
{
    public interface ILibraryManager
    {
        IEnumerable<Show> QueryShows(string selection);
    }
}
