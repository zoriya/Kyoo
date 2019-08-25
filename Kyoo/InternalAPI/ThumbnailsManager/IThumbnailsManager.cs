using Kyoo.Models;
using System.Collections.Generic;

namespace Kyoo.InternalAPI.ThumbnailsManager
{
    public interface IThumbnailsManager
    {
        Show Validate(Show show);
        List<People> Validate(List<People> actors);
        Episode Validate(Episode episode);
    }
}
