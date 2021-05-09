using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.CommonApi;
using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace Kyoo.Api
{
	[Route("api/studio")]
	[Route("api/studios")]
	[ApiController]
	public class StudioAPI : CrudApi<Studio>
	{
		private readonly ILibraryManager _libraryManager;

		public StudioAPI(ILibraryManager libraryManager, IConfiguration config)
			: base(libraryManager.StudioRepository, config)
		{
			_libraryManager = libraryManager;
		}
		
		[HttpGet("{id:int}/show")]
		[HttpGet("{id:int}/shows")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Show>>> GetShows(int id,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 20)
		{
			try
			{
				ICollection<Show> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere<Show>(where, x => x.StudioID == id),
					new Sort<Show>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetOrDefault<Studio>(id) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}
		
		[HttpGet("{slug}/show")]
		[HttpGet("{slug}/shows")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Show>>> GetShows(string slug,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 20)
		{
			try
			{
				ICollection<Show> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere<Show>(where, x => x.Studio.Slug == slug),
					new Sort<Show>(sortBy),
					new Pagination(limit, afterID));
				
				if (!resources.Any() && await _libraryManager.GetOrDefault<Studio>(slug) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}
	}
}