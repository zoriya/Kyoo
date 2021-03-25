using System;
using System.Collections.Generic;
using System.Linq;
using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Kyoo.CommonApi;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;

namespace Kyoo.Api
{
	[Route("api/collection")]
	[Route("api/collections")]
	[ApiController]
	public class CollectionApi : CrudApi<Collection>
	{
		private readonly ILibraryManager _libraryManager;
		
		public CollectionApi(ILibraryManager libraryManager, IConfiguration configuration) 
			: base(libraryManager.CollectionRepository, configuration)
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
			[FromQuery] int limit = 30)
		{
			try
			{
				ICollection<Show> resources = await _libraryManager.GetShows(
					ApiHelper.ParseWhere<Show>(where, x => x.Collections.Any(y => y.ID == id)),
					new Sort<Show>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetCollection(id) == null)
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
			[FromQuery] int limit = 30)
		{
			try
			{
				ICollection<Show> resources = await _libraryManager.GetShows(
					ApiHelper.ParseWhere<Show>(where, x => x.Collections.Any(y => y.Slug == slug)),
					new Sort<Show>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetCollection(slug) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}
		
		[HttpGet("{id:int}/library")]
		[HttpGet("{id:int}/libraries")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Library>>> GetLibraries(int id,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30)
		{
			try
			{
				ICollection<Library> resources = await _libraryManager.GetLibraries(
					ApiHelper.ParseWhere<Library>(where, x => x.Collections.Any(y => y.ID == id)),
					new Sort<Library>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetCollection(id) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}
		
		[HttpGet("{slug}/library")]
		[HttpGet("{slug}/libraries")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Library>>> GetLibraries(string slug,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30)
		{
			try
			{
				ICollection<Library> resources = await _libraryManager.GetLibraries(
					ApiHelper.ParseWhere<Library>(where, x => x.Collections.Any(y => y.Slug == slug)),
					new Sort<Library>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetCollection(slug) == null)
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