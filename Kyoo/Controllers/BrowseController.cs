using Kyoo.InternalAPI;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Diagnostics;

namespace Kyoo.Controllers
{
    [ApiController]
    public class BrowseController : ControllerBase
    {
        private readonly ILibraryManager libraryManager;

        public BrowseController(ILibraryManager libraryManager)
        {
            Debug.WriteLine("&Browse controller init");
            this.libraryManager = libraryManager;
        }

        [HttpGet("api/getall")]
        public IEnumerable<Show> GetAll()
        {
            return libraryManager.QueryShows(null);
        }
    }
}
