using Kyoo.InternalAPI;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Diagnostics;

namespace Kyoo.Controllers
{
    [Route("api/shows")]
    [ApiController]
    public class ShowsController : ControllerBase
    {
        private readonly ILibraryManager libraryManager;

        public ShowsController(ILibraryManager libraryManager)
        {
            this.libraryManager = libraryManager;
        }

        [HttpGet]
        public IEnumerable<Show> GetShows()
        {
            return libraryManager.QueryShows(null);
        }

        [HttpGet("{slug}")]
        public ActionResult<Show> GetShow(string slug)
        {
            Show show = libraryManager.GetShowBySlug(slug);

            if (show == null)
                return NotFound();

            return show;
        }
    }
}
