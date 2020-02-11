using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;

namespace Kyoo.Api
{
    [Route("api/libraries")]
    [ApiController]
    public class LibrariesController : ControllerBase
    {
        private readonly ILibraryManager _libraryManager;

        public LibrariesController(ILibraryManager libraryManager)
        {
            _libraryManager = libraryManager;
        }

        [HttpGet]
        public IEnumerable<Library> GetLibraries()
        {
            return _libraryManager.GetLibraries();
        }

        [HttpGet("{librarySlug}")]
        public ActionResult<IEnumerable<Show>> GetShows(string librarySlug)
        {
            Library library = _libraryManager.GetLibrary(librarySlug);

            if (library == null)
                return NotFound();

            return _libraryManager.GetShowsInLibrary(library.ID).ToList();
        }
    }
}