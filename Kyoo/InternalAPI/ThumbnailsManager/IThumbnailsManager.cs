using Kyoo.Models;

namespace Kyoo.InternalAPI.ThumbnailsManager
{
    public interface IThumbnailsManager
    {
        Show Validate(Show show);
        Episode Validate(Episode episode);
    }
}
