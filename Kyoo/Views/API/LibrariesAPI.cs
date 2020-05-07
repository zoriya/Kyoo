using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Authorization;

namespace Kyoo.Api
{
	[Route("api/libraries")]
	[Route("api/library")]
	[ApiController]
	public class LibrariesAPI : ControllerBase
	{
		private readonly ILibraryManager _libraryManager;
		private readonly ITaskManager _taskManager;

		public LibrariesAPI(ILibraryManager libraryManager, ITaskManager taskManager)
		{
			_libraryManager = libraryManager;
			_taskManager = taskManager;
		}

		[HttpGet]
		public IEnumerable<Library> GetLibraries()
		{
			return _libraryManager.GetLibraries();
		}
		
		[Route("/api/library/create")]
		[HttpPost]
		[Authorize(Policy="Admin")]
		public IActionResult CreateLibrary([FromBody] Library library)
		{
			if (!ModelState.IsValid)
				return BadRequest(library);
			if (string.IsNullOrEmpty(library.Slug))
				return BadRequest(new {error = "The library's slug must be set and not empty"});
			if (string.IsNullOrEmpty(library.Name))
				return BadRequest(new {error = "The library's name must be set and not empty"});
			if (library.Paths == null || library.Paths.Length == 0)
				return BadRequest(new {error = "The library should have a least one path."});
			if (_libraryManager.GetLibrary(library.Slug) != null)
				return BadRequest(new {error = "Duplicated library slug"});
			_libraryManager.RegisterLibrary(library);
			_taskManager.StartTask("scan", library.Slug);
			return Ok();
		}

		[HttpGet("{librarySlug}")]
		[Authorize(Policy="Read")]
		public ActionResult<IEnumerable<Show>> GetShows(string librarySlug)
		{
			Library library = _libraryManager.GetLibrary(librarySlug);

			if (library == null)
				return NotFound();

			return library.Shows.Concat(library.Collections.Select(x => x.AsShow())).ToList();
		}
	}
}