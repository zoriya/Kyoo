using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Api
{
	[Route("api/shows")]
	[Route("api/show")]
	[ApiController]
	public class ShowsAPI : ControllerBase
	{
		private readonly ILibraryManager _libraryManager;
		private readonly IProviderManager _providerManager;
		private readonly DatabaseContext _database;
		private readonly IThumbnailsManager _thumbnailsManager;

		public ShowsAPI(ILibraryManager libraryManager, IProviderManager providerManager, DatabaseContext database, IThumbnailsManager thumbnailsManager)
		{
			_libraryManager = libraryManager;
			_providerManager = providerManager;
			_database = database;
			_thumbnailsManager = thumbnailsManager;
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
		[Authorize(Policy="Write")]
		public IActionResult EditShow(string slug, [FromBody] Show show)
		{ 
			if (!ModelState.IsValid) 
				return BadRequest(show);

			Show old = _database.Shows.AsNoTracking().FirstOrDefault(x => x.Slug == slug);
			if (old == null)
				return NotFound();
			show.ID = old.ID;
			show.Slug = slug;
			show.Path = old.Path;
			_libraryManager.EditShow(show);
			return Ok();
		}
		
		[HttpPost("re-identify/{slug}")]
		[Authorize(Policy = "Write")]
		public async Task<IActionResult> ReIdentityShow(string slug, [FromBody] Show show)
		{
			if (!ModelState.IsValid)
				return BadRequest(show);
			Show old = _database.Shows.FirstOrDefault(x => x.Slug == slug);
			if (old == null)
				return NotFound();
			Show edited = await _providerManager.CompleteShow(show, _libraryManager.GetLibraryForShow(slug));
			edited.ID = old.ID;
			edited.Slug = old.Slug;
			edited.Path = old.Path;
			_libraryManager.EditShow(edited);
			await _thumbnailsManager.Validate(edited, true);
			return Ok();
		}

		[HttpGet("identify/{name}")]
		[Authorize(Policy = "Read")]
		public async Task<IEnumerable<Show>> IdentityShow(string name, [FromQuery] bool isMovie)
		{
			return await _providerManager.SearchShows(name, isMovie, null);
		}

		[HttpPost("download-images/{slug}")]
		[Authorize(Policy = "Write")]
		public async Task<IActionResult> DownloadImages(string slug)
		{
			Show show = _libraryManager.GetShowBySlug(slug);
			if (show == null)
				return NotFound();
			await _thumbnailsManager.Validate(show, true);
			return Ok();
		}
	}
}
