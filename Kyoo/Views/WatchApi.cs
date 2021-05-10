using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Kyoo.Models.Permissions;
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

		[HttpGet("{slug}")]
		[Permission("video", Kind.Read)]
		public async Task<ActionResult<WatchItem>> GetWatchItem(string slug)
		{
			try
			{
				Episode item = await _libraryManager.Get<Episode>(slug);
				return await WatchItem.FromEpisode(item, _libraryManager);
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
		}
	}
}
