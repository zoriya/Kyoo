using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Api
{
    [Route("api/[controller]")]
    [ApiController]
    public class WatchController : ControllerBase
    {
        private readonly ILibraryManager _libraryManager;

        public WatchController(ILibraryManager libraryManager)
        {
            _libraryManager = libraryManager;
        }

        [HttpGet("{showSlug}-s{seasonNumber}e{episodeNumber}")]
        public ActionResult<WatchItem> Index(string showSlug, long seasonNumber, long episodeNumber)
        {
            WatchItem item = _libraryManager.GetWatchItem(showSlug, seasonNumber, episodeNumber);

            if(item == null)
                return NotFound();

            return item;
        }
    }
}
