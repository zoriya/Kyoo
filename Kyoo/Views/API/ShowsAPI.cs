using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models.Exceptions;
using Microsoft.AspNetCore.Authorization;

namespace Kyoo.Api
{
	[Route("api/shows")]
	[Route("api/show")]
	[ApiController]
	public class ShowsAPI : ControllerBase
	{
		private readonly ILibraryManager _libraryManager;
		private readonly IProviderManager _providerManager;

		public ShowsAPI(ILibraryManager libraryManager, IProviderManager providerManager)
		{
			_libraryManager = libraryManager;
			_providerManager = providerManager;
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
			show.ID = 0;
			show.Slug = slug;
			try
			{
				_libraryManager.EditShow(show);
			}
			catch (ItemNotFound)
			{
				return NotFound();
			}
			return Ok();
		}

		[HttpGet("identify/{name}")]
		[Authorize(Policy = "Read")]
		public async Task<IEnumerable<Show>> IdentityShow(string name, [FromQuery] bool isMovie)
		{
			return await _providerManager.SearchShows(name, isMovie, null);
		}
	}
}
