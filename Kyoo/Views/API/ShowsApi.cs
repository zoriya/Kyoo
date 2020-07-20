using System;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using Kyoo.CommonApi;
using Kyoo.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;

namespace Kyoo.Api
{
	[Route("api/show")]
	[Route("api/shows")]
	[ApiController]
	public class ShowsApi : CrudApi<Show>
	{
		private readonly ILibraryManager _libraryManager;

		public ShowsApi(ILibraryManager libraryManager,
			IConfiguration configuration)
			: base(libraryManager.ShowRepository, configuration)
		{
			_libraryManager = libraryManager;
		}

		[HttpGet("{showID:int}/season")]
		[HttpGet("{showID:int}/seasons")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Season>>> GetSeasons(int showID,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 20)
		{
			where.Remove("showID");
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Season> ressources = await _libraryManager.GetSeasons(showID,
					ApiHelper.ParseWhere<Season>(where),
					new Sort<Season>(sortBy),
					new Pagination(limit, afterID));

				return Page(ressources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}

		[HttpGet("{slug}/season")]
		[HttpGet("{slug}/seasons")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Season>>> GetSeasons(string slug,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 20)
		{
			where.Remove("slug");
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Season> ressources = await _libraryManager.GetSeasons(slug,
					ApiHelper.ParseWhere<Season>(where),
					new Sort<Season>(sortBy),
					new Pagination(limit, afterID));

				return Page(ressources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}
	}
}
