using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Kyoo.CommonApi;
using Kyoo.Controllers;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
		
		[HttpGet("{seasonID:int}/season")]
		[HttpGet("{seasonID:int}/seasons")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Episode>>> GetSeasons(int seasonID,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 20)
		{
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Episode> ressources = await _libraryManager.GetEpisodesFromSeason(seasonID,
					ApiHelper.ParseWhere<Episode>(where),
					new Sort<Episode>(sortBy),
					new Pagination(limit, afterID));

				return Page(ressources, limit);
			}
			catch (ItemNotFound)
			{
				return NotFound();
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}
		
		[HttpGet("{showSlug}-{seasonNumber:int}/season")]
		[HttpGet("{showSlug}-{seasonNumber:int}/seasons")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Episode>>> GetSeasons(string showSlug,
			int seasonNumber,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 20)
		{
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Episode> ressources = await _libraryManager.GetEpisodesFromSeason(showSlug,
					seasonNumber,
					ApiHelper.ParseWhere<Episode>(where),
					new Sort<Episode>(sortBy),
					new Pagination(limit, afterID));

				return Page(ressources, limit);
			}
			catch (ItemNotFound)
			{
				return NotFound();
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}
		
		[HttpGet("{showID:int}-{seasonNumber:int}/season")]
		[HttpGet("{showID:int}-{seasonNumber:int}/seasons")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Episode>>> GetSeasons(int showID,
			int seasonNumber,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 20)
		{
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Episode> ressources = await _libraryManager.GetEpisodesFromSeason(showID,
					seasonNumber,
					ApiHelper.ParseWhere<Episode>(where),
					new Sort<Episode>(sortBy),
					new Pagination(limit, afterID));

				return Page(ressources, limit);
			}
			catch (ItemNotFound)
			{
				return NotFound();
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}
	}
}