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
	[Route("api/library")]
	[Route("api/libraries")]
	[ApiController]
	public class LibraryAPI : CrudApi<Library>
	{
		private readonly ILibraryManager _libraryManager;
		private readonly ITaskManager _taskManager;

		public LibraryAPI(ILibraryManager libraryManager, ITaskManager taskManager, IConfiguration configuration)
			: base(libraryManager.LibraryRepository, configuration)
		{
			_libraryManager = libraryManager;
			_taskManager = taskManager;
		}

		[Authorize(Policy = "Write")]
		public override async Task<ActionResult<Library>> Create(Library resource)
		{
			ActionResult<Library> result = await base.Create(resource);
			if (result.Value != null)
				_taskManager.StartTask("scan", new Dictionary<string, object> {{"slug", result.Value.Slug}});
			return result;
		}
		
		[HttpGet("{id:int}/show")]
		[HttpGet("{id:int}/shows")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Show>>> GetShows(int id,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 50)
		{
			try
			{
				ICollection<Show> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere<Show>(where, x => x.Libraries.Any(y => y.ID == id)),
					new Sort<Show>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetOrDefault<Library>(id) == null)
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
					ApiHelper.ParseWhere<Show>(where, x => x.Libraries.Any(y => y.Slug == slug)),
					new Sort<Show>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.Get<Library>(slug) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}
		
		[HttpGet("{id:int}/collection")]
		[HttpGet("{id:int}/collections")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Collection>>> GetCollections(int id,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 50)
		{
			try
			{
				ICollection<Collection> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere<Collection>(where, x => x.Libraries.Any(y => y.ID == id)),
					new Sort<Collection>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetOrDefault<Library>(id) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}

		[HttpGet("{slug}/collection")]
		[HttpGet("{slug}/collections")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Collection>>> GetCollections(string slug,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 20)
		{
			try
			{
				ICollection<Collection> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere<Collection>(where, x => x.Libraries.Any(y => y.Slug == slug)),
					new Sort<Collection>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.Get<Library>(slug) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}
		
		[HttpGet("{id:int}/item")]
		[HttpGet("{id:int}/items")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<LibraryItem>>> GetItems(int id,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 50)
		{
			try
			{
				ICollection<LibraryItem> resources = await _libraryManager.GetItemsFromLibrary(id,
					ApiHelper.ParseWhere<LibraryItem>(where),
					new Sort<LibraryItem>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetOrDefault<Library>(id) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}
		
		[HttpGet("{slug}/item")]
		[HttpGet("{slug}/items")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<LibraryItem>>> GetItems(string slug,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 50)
		{
			try
			{
				ICollection<LibraryItem> resources = await _libraryManager.GetItemsFromLibrary(slug,
					ApiHelper.ParseWhere<LibraryItem>(where),
					new Sort<LibraryItem>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.Get<Library>(slug) == null)
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