using System;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;

namespace Kyoo.API
{
	[Route("api/shows")]
	[Route("api/show")]
	[ApiController]
	public class ShowsAPI : ControllerBase
	{
		private readonly IShowRepository _shows;
		private readonly IProviderManager _providerManager;
		private readonly IThumbnailsManager _thumbnailsManager;
		private readonly ITaskManager _taskManager;
		private readonly string _baseURL;

		public ShowsAPI(IShowRepository shows,
			IProviderManager providerManager,
			IThumbnailsManager thumbnailsManager,
			ITaskManager taskManager,
			IConfiguration configuration)
		{
			_shows = shows;
			_providerManager = providerManager;
			_thumbnailsManager = thumbnailsManager;
			_taskManager = taskManager;
			_baseURL = configuration.GetValue<string>("public_url").TrimEnd('/');
		}

		[HttpGet]
		[Authorize(Policy="Read")]
		public async Task<ActionResult<Page<Show>>> GetShows([FromQuery] string sortBy, 
			[FromQuery] int limit, 
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where)
		{
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");
			if (limit == 0)
				limit = 20;

			try
			{
				ICollection<Show> shows = await _shows.GetAll(Utility.ParseWhere<Show>(where),
					new Sort<Show>(sortBy),
					new Pagination(limit, afterID));

				return new Page<Show>(shows,
					x => $"{x.ID}",
					_baseURL + Request.Path,
					Request.Query.ToDictionary(x => x.Key, x => x.Value.ToString(), StringComparer.InvariantCultureIgnoreCase),
					limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new { Error = ex.Message });
			}
		}
		
		[HttpGet("{id}")]
		[Authorize(Policy="Read")]
		[JsonDetailed]
		public async Task<ActionResult<Show>> GetShow(int id)
		{
			Show show = await _shows.Get(id);
			if (show == null)
				return NotFound();
			
			return show;
		}

		[HttpGet("{slug}")]
		[Authorize(Policy="Read")]
		[JsonDetailed]
		public async Task<ActionResult<Show>> GetShow(string slug)
		{
			Show show = await _shows.Get(slug);
			if (show == null)
				return NotFound();
			
			return show;
		}

		[HttpPost]
		[Authorize(Policy="Write")]
		public async Task<ActionResult<Show>> CreateShow([FromBody] Show show)
		{
			try
			{
				return await _shows.Create(show);
			}
			catch (DuplicatedItemException)
			{
				Show existing = await _shows.Get(show.Slug);
				return Conflict(existing);
			}
		}
		
		[HttpPut("{slug}")]
		[Authorize(Policy="Write")]
		public async Task<ActionResult<Show>> EditShow(string slug, [FromQuery] bool resetOld, [FromBody] Show show)
		{
			Show old = await _shows.Get(slug);
			if (old == null)
				return NotFound();
			show.ID = old.ID;
			show.Path = old.Path;
			return await _shows.Edit(show, resetOld);
		}
		
		[HttpDelete("{slug}")]
		// [Authorize(Policy="Write")]
		public async Task<IActionResult> DeleteShow(string slug)
		{
			try
			{
				await _shows.Delete(slug);
			}
			catch (ItemNotFound)
			{
				return NotFound();
			}
			return Ok();
		}
		
		[HttpDelete("{id}")]
		// [Authorize(Policy="Write")]
		public async Task<IActionResult> DeleteShow(int id)
		{
			try
			{
				await _shows.Delete(id);
			}
			catch (ItemNotFound)
			{
				return NotFound();
			}
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
