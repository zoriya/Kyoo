using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Kyoo.CommonApi;
using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using Microsoft.Extensions.Configuration;

namespace Kyoo.Api
{
	[Route("api/season")]
	[Route("api/seasons")]
	[ApiController]
	public class SeasonApi : CrudApi<Season>
	{
		private readonly ILibraryManager _libraryManager;

		public SeasonApi(ILibraryManager libraryManager, IConfiguration configuration)
			: base(libraryManager.SeasonRepository, configuration)
		{
			_libraryManager = libraryManager;
		}
		
		[HttpGet("{seasonID:int}/episode")]
		[HttpGet("{seasonID:int}/episodes")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Episode>>> GetEpisode(int seasonID,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30)
		{
			try
			{
				ICollection<Episode> resources = await _libraryManager.GetEpisodes(
					ApiHelper.ParseWhere<Episode>(where, x => x.SeasonID == seasonID),
					new Sort<Episode>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetSeason(seasonID) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}
		
		[HttpGet("{showSlug}-s{seasonNumber:int}/episode")]
		[HttpGet("{showSlug}-s{seasonNumber:int}/episodes")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Episode>>> GetEpisode(string showSlug,
			int seasonNumber,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30)
		{
			try
			{
				ICollection<Episode> resources = await _libraryManager.GetEpisodes(
					ApiHelper.ParseWhere<Episode>(where, x => x.Show.Slug == showSlug 
					                                          && x.SeasonNumber == seasonNumber),
					new Sort<Episode>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetSeason(showSlug, seasonNumber) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}
		
		[HttpGet("{showID:int}-s{seasonNumber:int}/episode")]
		[HttpGet("{showID:int}-s{seasonNumber:int}/episodes")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Episode>>> GetEpisode(int showID,
			int seasonNumber,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30)
		{
			try
			{
				ICollection<Episode> resources = await _libraryManager.GetEpisodes(
					ApiHelper.ParseWhere<Episode>(where, x => x.ShowID == showID && x.SeasonNumber == seasonNumber),
					new Sort<Episode>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetSeason(showID, seasonNumber) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}
		
		[HttpGet("{seasonID:int}/show")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Show>> GetShow(int seasonID)
		{
			return await _libraryManager.GetShow(x => x.Seasons.Any(y => y.ID == seasonID));
		}
		
		[HttpGet("{showSlug}-s{seasonNumber:int}/show")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Show>> GetShow(string showSlug, int _)
		{
			return await _libraryManager.GetShow(showSlug);
		}
		
		[HttpGet("{showID:int}-s{seasonNumber:int}/show")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Show>> GetShow(int showID, int _)
		{
			return await _libraryManager.GetShow(showID);
		}
		
		[HttpGet("{id:int}/thumb")]
		[Authorize(Policy="Read")]
		public async Task<IActionResult> GetThumb(int id)
		{
			// TODO remove the next lambda and use a Season.Path (should exit for seasons in a different folder)
			string path = (await _libraryManager.GetShow(x => x.Seasons.Any(y => y.ID == id)))?.Path;
			int seasonNumber = (await _libraryManager.GetSeason(id)).SeasonNumber;
			if (path == null)
				return NotFound();

			string thumb = Path.Combine(path, $"season-{seasonNumber}.jpg");
			if (System.IO.File.Exists(thumb))
				return new PhysicalFileResult(Path.GetFullPath(thumb), "image/jpg");
			return NotFound();
		}
		
		[HttpGet("{showSlug}-s{seasonNumber:int}/thumb")]
		[Authorize(Policy="Read")]
		public async Task<IActionResult> GetThumb(string showSlug, int seasonNumber)
		{
			// TODO use a season.Path
			string path = (await _libraryManager.GetShow(showSlug))?.Path;
			if (path == null)
				return NotFound();

			string thumb = Path.Combine(path, $"season-{seasonNumber}.jpg");
			if (System.IO.File.Exists(thumb))
				return new PhysicalFileResult(Path.GetFullPath(thumb), "image/jpg");
			return NotFound();
		}
	}
}