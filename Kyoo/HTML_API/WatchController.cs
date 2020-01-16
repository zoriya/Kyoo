using Kyoo.InternalAPI;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

// For more information on enabling MVC for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Kyoo.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WatchController : ControllerBase
    {
        private readonly ILibraryManager libraryManager;

        public WatchController(ILibraryManager libraryManager)
        {
            this.libraryManager = libraryManager;
        }

        [HttpGet("{showSlug}-s{seasonNumber}e{episodeNumber}")]
        public ActionResult<WatchItem> Index(string showSlug, long seasonNumber, long episodeNumber)
        {
            WatchItem item = libraryManager.GetWatchItem(showSlug, seasonNumber, episodeNumber);

            if(item == null)
                return NotFound();

            return item;
        }
    }
}
