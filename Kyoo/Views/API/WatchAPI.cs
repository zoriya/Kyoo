using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.API
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
		public async Task<ActionResult<WatchItem>> Index(string showSlug, int seasonNumber, int episodeNumber)
		{
			Episode item = await _libraryManager.GetEpisode(showSlug, seasonNumber, episodeNumber);

			if(item == null)
				return NotFound();

			return new WatchItem(item);;
		}
		
		[HttpGet("{movieSlug}")]
		[Authorize(Policy="Read")]
		public async Task<ActionResult<WatchItem>> Index(string movieSlug)
		{
			Episode item = await _libraryManager.GetMovieEpisode(movieSlug);

			if(item == null)
				return NotFound();
			return new WatchItem(item);
		}
	}
}
