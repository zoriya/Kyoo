using System;
using System.Collections.Generic;
using System.Linq;
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
	[Route("api/genre")]
	[Route("api/genres")]
	[ApiController]
	public class GenreApi : CrudApi<Genre>
	{
		private readonly ILibraryManager _libraryManager;

		public GenreApi(ILibraryManager libraryManager, IConfiguration config)
			: base(libraryManager.GenreRepository, config)
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
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Show> ressources = await _libraryManager.GetShows(
					ApiHelper.ParseWhere<Show>(where, x => x.Genres.Any(y => y.ID == id)),
					new Sort<Show>(sortBy),
					new Pagination(limit, afterID));

				if (!ressources.Any() && await _libraryManager.GetGenre(id) == null)
					return NotFound();
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
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Show> ressources = await _libraryManager.GetShows(
					ApiHelper.ParseWhere<Show>(where, x => x.Genres.Any(y => y.Slug == slug)),
					new Sort<Show>(sortBy),
					new Pagination(limit, afterID));

				if (!ressources.Any() && await _libraryManager.GetGenre(slug) == null)
					return NotFound();
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