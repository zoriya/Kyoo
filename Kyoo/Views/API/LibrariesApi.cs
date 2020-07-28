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
	[Route("api/library")]
	[Route("api/libraries")]
	[ApiController]
	public class LibrariesAPI : CrudApi<Library>
	{
		private readonly ILibraryManager _libraryManager;
		private readonly ITaskManager _taskManager;

		public LibrariesAPI(ILibraryManager libraryManager, ITaskManager taskManager, IConfiguration configuration)
			: base(libraryManager.LibraryRepository, configuration)
		{
			_libraryManager = libraryManager;
			_taskManager = taskManager;
		}

		[Authorize(Policy = "Admin")]
		public override async Task<ActionResult<Library>> Create(Library ressource)
		{
			ActionResult<Library> result = await base.Create(ressource);
			if (result.Value != null)
				_taskManager.StartTask("scan", result.Value.Slug);
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
			where.Remove("id");
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Show> ressources = await _libraryManager.GetShowsFromLibrary(id,
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
			[FromQuery] int limit = 20)
		{
			where.Remove("slug");
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Show> ressources = await _libraryManager.GetShowsFromLibrary(slug,
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
		
		[HttpGet("{id:int}/collection")]
		[HttpGet("{id:int}/collections")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Collection>>> GetCollections(int id,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 50)
		{
			where.Remove("id");
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Collection> ressources = await _libraryManager.GetCollectionsFromLibrary(id,
					ApiHelper.ParseWhere<Collection>(where),
					new Sort<Collection>(sortBy),
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

		[HttpGet("{slug}/collection")]
		[HttpGet("{slug}/collections")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Collection>>> GetCollections(string slug,
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
				ICollection<Collection> ressources = await _libraryManager.GetCollectionsFromLibrary(slug,
					ApiHelper.ParseWhere<Collection>(where),
					new Sort<Collection>(sortBy),
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
		
		[HttpGet("{id:int}/item")]
		[HttpGet("{id:int}/items")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<LibraryItem>>> GetItems(int id,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 50)
		{
			where.Remove("id");
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<LibraryItem> ressources = await ((LibraryRepository)_libraryManager.LibraryRepository).GetItems("",
					ApiHelper.ParseWhere<LibraryItem>(where),
					new Sort<LibraryItem>(sortBy),
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
		//
		// [HttpGet("{slug}/collection")]
		// [HttpGet("{slug}/collections")]
		// [Authorize(Policy = "Read")]
		// public async Task<ActionResult<Page<Collection>>> GetCollections(string slug,
		// 	[FromQuery] string sortBy,
		// 	[FromQuery] int afterID,
		// 	[FromQuery] Dictionary<string, string> where,
		// 	[FromQuery] int limit = 20)
		// {
		// 	where.Remove("slug");
		// 	where.Remove("sortBy");
		// 	where.Remove("limit");
		// 	where.Remove("afterID");
		//
		// 	try
		// 	{
		// 		ICollection<Collection> ressources = await _libraryManager.GetCollectionsFromLibrary(slug,
		// 			ApiHelper.ParseWhere<Collection>(where),
		// 			new Sort<Collection>(sortBy),
		// 			new Pagination(limit, afterID));
		//
		// 		return Page(ressources, limit);
		// 	}
		// 	catch (ItemNotFound)
		// 	{
		// 		return NotFound();
		// 	}
		// 	catch (ArgumentException ex)
		// 	{
		// 		return BadRequest(new {Error = ex.Message});
		// 	}
		// }
	}
}