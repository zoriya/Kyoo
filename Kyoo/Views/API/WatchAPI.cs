using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Api
{
	[Route("api/[controller]")]
	[ApiController]
	public class WatchController : ControllerBase
	{
		private readonly ILibraryManager _libraryManager;

		public WatchController(ILibraryManager libraryManager)
		{
			_libraryManager = libraryManager;
		}

		[HttpGet("{showSlug}-s{seasonNumber}e{episodeNumber}")]
		[Authorize(Policy="Read")]
		public ActionResult<WatchItem> Index(string showSlug, long seasonNumber, long episodeNumber)
		{
			Episode item = _libraryManager.GetEpisode(showSlug, seasonNumber, episodeNumber);

			if(item == null)
				return NotFound();

			return new WatchItem(item);;
		}
		
		[HttpGet("{movieSlug}")]
		[Authorize(Policy="Read")]
		public ActionResult<WatchItem> Index(string movieSlug)
		{
			Episode item = _libraryManager.GetMovieEpisode(movieSlug);

			if(item == null)
				return NotFound();
			return new WatchItem(item);
		}
	}
}
