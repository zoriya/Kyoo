using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Controllers;
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
		private readonly ITaskManager _taskManager;

		public ShowsAPI(ILibraryManager libraryManager,
			IProviderManager providerManager,
			DatabaseContext database,
			IThumbnailsManager thumbnailsManager,
			ITaskManager taskManager)
		{
			_libraryManager = libraryManager;
			_providerManager = providerManager;
			_database = database;
			_thumbnailsManager = thumbnailsManager;
			_taskManager = taskManager;
		}

		[HttpGet]
		[Authorize(Policy="Read")]
		public async Task<IEnumerable<Show>> GetShows([FromQuery] string sortBy, 
			[FromQuery] int limit, 
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where)
		{
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");
			
			return await _libraryManager.GetShows(Utility.ParseWhere<Show>(where),
				new Sort<Show>(sortBy),
				new Pagination(limit, afterID));
		}

		[HttpGet("{slug}")]
		[Authorize(Policy="Read")]
		[JsonDetailed]
		public async Task<ActionResult<Show>> GetShow(string slug)
		{
			Show show = await _libraryManager.GetShow(slug);

			if (show == null)
				return NotFound();
			
			return show;
		}
		
		[HttpPost("edit/{slug}")]
		[Authorize(Policy="Write")]
		public async Task<IActionResult> EditShow(string slug, [FromBody] Show show)
		{ 
			if (!ModelState.IsValid) 
				return BadRequest(show);

			Show old = _database.Shows.AsNoTracking().FirstOrDefault(x => x.Slug == slug);
			if (old == null)
				return NotFound();
			show.ID = old.ID;
			show.Slug = slug;
			show.Path = old.Path;
			await _libraryManager.EditShow(show, false);
			return Ok();
		}
		
		[HttpPost("re-identify/{slug}")]
		[Authorize(Policy = "Write")]
		public IActionResult ReIdentityShow(string slug, [FromBody] IEnumerable<MetadataID> externalIDs)
		{
			if (!ModelState.IsValid)
				return BadRequest(externalIDs);
			Show show = _database.Shows.Include(x => x.ExternalIDs).FirstOrDefault(x => x.Slug == slug);
			if (show == null)
				return NotFound();
			_database.SaveChanges();
			_taskManager.StartTask("re-scan", $"show/{slug}");
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
			Show show = await _libraryManager.GetShow(slug);
			if (show == null)
				return NotFound();
			await _thumbnailsManager.Validate(show, true);
			return Ok();
		}
	}
}
