using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Exceptions;
using Kyoo.Abstractions.Models.Permissions;
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
