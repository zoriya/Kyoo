using System;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using Kyoo.CommonApi;
using Kyoo.Controllers;
using Kyoo.Models.Exceptions;
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
				ICollection<Season> ressources = await _libraryManager.GetSeasonsFromShow(showID,
					ApiHelper.ParseWhere<Season>(where),
					new Sort<Season>(sortBy),
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
				ICollection<Season> ressources = await _libraryManager.GetSeasonsFromShow(slug,
					ApiHelper.ParseWhere<Season>(where),
					new Sort<Season>(sortBy),
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
		
		[HttpGet("{showID:int}/episode")]
		[HttpGet("{showID:int}/episodes")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Episode>>> GetEpisodes(int showID,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 50)
		{
			where.Remove("showID");
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Episode> ressources = await _libraryManager.GetEpisodesFromShow(showID,
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

		[HttpGet("{slug}/episode")]
		[HttpGet("{slug}/episodes")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Episode>>> GetEpisodes(string slug,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 50)
		{
			where.Remove("slug");
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Episode> ressources = await _libraryManager.GetEpisodesFromShow(slug,
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
		
		[HttpGet("{showID:int}/people")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<PeopleLink>>> GetPeople(int showID,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30)
		{
			where.Remove("showID");
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<PeopleLink> ressources = await _libraryManager.GetPeopleFromShow(showID,
					ApiHelper.ParseWhere<PeopleLink>(where),
					new Sort<PeopleLink>(sortBy),
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

		[HttpGet("{slug}/people")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<PeopleLink>>> GetPeople(string slug,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30)
		{
			where.Remove("slug");
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<PeopleLink> ressources = await _libraryManager.GetPeopleFromShow(slug,
					ApiHelper.ParseWhere<PeopleLink>(where),
					new Sort<PeopleLink>(sortBy),
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
		
		[HttpGet("{showID:int}/genre")]
		[HttpGet("{showID:int}/genres")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Genre>>> GetGenres(int showID,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30)
		{
			where.Remove("showID");
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Genre> ressources = await _libraryManager.GetGenresFromShow(showID,
					ApiHelper.ParseWhere<Genre>(where),
					new Sort<Genre>(sortBy),
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

		[HttpGet("{slug}/genre")]
		[HttpGet("{slug}/genres")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Genre>>> GetGenre(string slug,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30)
		{
			where.Remove("slug");
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Genre> ressources = await _libraryManager.GetGenresFromShow(slug,
					ApiHelper.ParseWhere<Genre>(where),
					new Sort<Genre>(sortBy),
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
		
		[HttpGet("{showID:int}/studio")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Studio>> GetStudio(int showID)
		{
			try
			{
				return await _libraryManager.GetStudioFromShow(showID);
			}
			catch (ItemNotFound)
			{
				return NotFound();
			}
		}

		[HttpGet("{slug}/studio")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Studio>> GetStudio(string slug)
		{
			try
			{
				return await _libraryManager.GetStudioFromShow(slug);
			}
			catch (ItemNotFound)
			{
				return NotFound();
			}
		}
		
		[HttpGet("{showID:int}/library")]
		[HttpGet("{showID:int}/libraries")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Library>>> GetLibraries(int showID,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30)
		{
			where.Remove("showID");
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Library> ressources = await _libraryManager.GetLibrariesFromShow(showID,
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
			where.Remove("slug");
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Library> ressources = await _libraryManager.GetLibrariesFromShow(slug,
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
		
		[HttpGet("{showID:int}/collection")]
		[HttpGet("{showID:int}/collections")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Collection>>> GetCollections(int showID,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30)
		{
			where.Remove("showID");
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Collection> ressources = await _libraryManager.GetCollectionsFromShow(showID,
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
			[FromQuery] int limit = 30)
		{
			where.Remove("slug");
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Collection> ressources = await _libraryManager.GetCollectionsFromShow(slug,
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
	}
}
