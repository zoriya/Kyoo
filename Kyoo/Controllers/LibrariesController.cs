using Kyoo.InternalAPI;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;

namespace Kyoo.Controllers
{
    [Route("api/libraries")]
    [ApiController]
    public class LibrariesController : ControllerBase
    {
        private readonly ILibraryManager libraryManager;

        public LibrariesController(ILibraryManager libraryManager)
        {
            this.libraryManager = libraryManager;
        }

        [HttpGet]
        public IEnumerable<Library> GetLibraries()
        {
            return libraryManager.GetLibraries();
        }
    }
}