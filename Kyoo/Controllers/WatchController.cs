using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.InternalAPI;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;

// For more information on enabling MVC for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Kyoo.Controllers
{
    [Route("api/[controller]")]
    public class WatchController : Controller
    {
        private readonly ILibraryManager libraryManager;

        public WatchController(ILibraryManager libraryManager)
        {
            this.libraryManager = libraryManager;
        }


        [HttpGet("{showSlug}-s{seasonNumber}e{episodeNumber}")]
        public IActionResult Index(string showSlug, long seasonNumber, long episodeNumber)
        {
            Debug.WriteLine("&Trying to watch " + showSlug + " season " + seasonNumber + " episode " + episodeNumber);

            Episode episode = libraryManager.GetEpisode(showSlug, seasonNumber, episodeNumber);

            return NotFound();
        }
    }
}
