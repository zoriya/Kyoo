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
	[Route("api/people")]
	[ApiController]
	public class PeopleApi : CrudApi<People>
	{
		private readonly ILibraryManager _libraryManager;

		public PeopleApi(ILibraryManager libraryManager, IConfiguration configuration) 
			: base(libraryManager.PeopleRepository, configuration)
		{
			_libraryManager = libraryManager;
		}

		[HttpGet("{id:int}/role")]
		[HttpGet("{id:int}/roles")]
		[Authorize(Policy = "Read")]
		[JsonDetailed]
		public async Task<ActionResult<Page<ShowRole>>> GetRoles(int id,
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
				ICollection<ShowRole> resources = await _libraryManager.GetRolesFromPeople(id,
					ApiHelper.ParseWhere<ShowRole>(where),
					new Sort<ShowRole>(sortBy),
					new Pagination(limit, afterID));

				return Page(resources, limit);
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

		[HttpGet("{slug}/role")]
		[HttpGet("{slug}/roles")]
		[Authorize(Policy = "Read")]
		[JsonDetailed]
		public async Task<ActionResult<Page<ShowRole>>> GetRoles(string slug,
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
				ICollection<ShowRole> resources = await _libraryManager.GetRolesFromPeople(slug,
					ApiHelper.ParseWhere<ShowRole>(where),
					new Sort<ShowRole>(sortBy),
					new Pagination(limit, afterID));

				return Page(resources, limit);
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