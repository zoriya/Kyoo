using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using Kyoo.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Api
{
	[Route("api/shows")]
	[Route("api/show")]
	[ApiController]
	public class ShowsController : ControllerBase
	{
		private readonly ILibraryManager _libraryManager;

		public ShowsController(ILibraryManager libraryManager)
		{
			_libraryManager = libraryManager;
		}

		[HttpGet]
		[Authorize(Policy="Read")]
		public IEnumerable<Show> GetShows()
		{
			return _libraryManager.GetShows();
		}

		[HttpGet("{slug}")]
		[Authorize(Policy="Read")]
		[JsonDetailed]
		public ActionResult<Show> GetShow(string slug)
		{
			Show show = _libraryManager.GetShowBySlug(slug);

			if (show == null)
				return NotFound();
			
			return show;
		}
		
		[HttpPost("edit/{slug}")]
		// [Authorize(Policy="Write")]
		public IActionResult EditShow(string slug, [FromBody] Show show)
		{
			if (!ModelState.IsValid)
				return BadRequest(show);

			Show old = _libraryManager.GetShowBySlug(slug);
			if (old == null)
				return NotFound();
			show.ID = 0;
			//Should prevent duplicates (If the user put another studio, it is always created even if there is already a studio with the same slug.
			old = Utility.Complete(old, show);
			_libraryManager.RegisterShow(old);
			return Ok();
		}
	}
}
