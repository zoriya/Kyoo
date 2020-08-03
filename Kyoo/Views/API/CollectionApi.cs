using System;
using System.Collections.Generic;
using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Kyoo.CommonApi;
using Kyoo.Models.Exceptions;
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
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Show> ressources = await _libraryManager.GetShowsFromCollection(id,
					ApiHelper.ParseWhere<Show>(where),
					new Sort<Show>(sortBy),
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
		
		[HttpGet("{slug}/show")]
		[HttpGet("{slug}/shows")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Show>>> GetShows(string slug,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30)
		{
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Show> ressources = await _libraryManager.GetShowsFromCollection(slug,
					ApiHelper.ParseWhere<Show>(where),
					new Sort<Show>(sortBy),
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
		
		[HttpGet("{id:int}/library")]
		[HttpGet("{id:int}/libraries")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Library>>> GetLibraries(int id,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30)
		{
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Library> ressources = await _libraryManager.GetLibrariesFromCollection(id,
					ApiHelper.ParseWhere<Library>(where),
					new Sort<Library>(sortBy),
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
		
		[HttpGet("{slug}/library")]
		[HttpGet("{slug}/libraries")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Library>>> GetLibraries(string slug,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30)
		{
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Library> ressources = await _libraryManager.GetLibrariesFromCollection(slug,
					ApiHelper.ParseWhere<Library>(where),
					new Sort<Library>(sortBy),
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