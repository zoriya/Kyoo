using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Api
{
	[Route("api/watch")]
	[ApiController]
	public class WatchApi : ControllerBase
	{
		private readonly ILibraryManager _libraryManager;

		public WatchApi(ILibraryManager libraryManager)
		{
			_libraryManager = libraryManager;
		}

		[HttpGet("{showSlug}-s{seasonNumber:int}e{episodeNumber:int}")]
		[Authorize(Policy="Read")]
		public async Task<ActionResult<WatchItem>> GetWatchItem(string showSlug, int seasonNumber, int episodeNumber)
		{
			Episode item = await _libraryManager.GetEpisode(showSlug, seasonNumber, episodeNumber);
			if (item == null)
				return NotFound();
			return await WatchItem.FromEpisode(item, _libraryManager);
		}
		
		[HttpGet("{movieSlug}")]
		[Authorize(Policy="Read")]
		public async Task<ActionResult<WatchItem>> GetWatchItem(string movieSlug)
		{
			Episode item = await _libraryManager.GetMovieEpisode(movieSlug);
			if (item == null)
				return NotFound();
			return await WatchItem.FromEpisode(item, _libraryManager);
		}
	}
}
