using Kyoo.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Kyoo.InternalAPI.ThumbnailsManager
{
    public interface IThumbnailsManager
    {
        Task<Show> Validate(Show show);
        Task<List<People>> Validate(List<People> actors);
        Task<Episode> Validate(Episode episode);
    }
}
