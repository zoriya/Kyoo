using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace Kyoo.CommonApi
{
	[ApiController]
	public class CrudApi<T> : ControllerBase where T : IRessource
	{
		private readonly IRepository<T> _repository;
		private readonly string _baseURL;

		public CrudApi(IRepository<T> repository, IConfiguration configuration)
		{
			_repository = repository;
			_baseURL = configuration.GetValue<string>("public_url").TrimEnd('/');
		}
		
		[HttpGet("{id}")]
		[Authorize(Policy = "Read")]
		[JsonDetailed]
		public async Task<ActionResult<T>> Get(int id)
		{
			T ressource = await _repository.Get(id);
			if (ressource == null)
				return NotFound();

			return ressource;
		}

		[HttpGet("{slug}")]
		[Authorize(Policy = "Read")]
		[JsonDetailed]
		public async Task<ActionResult<T>> Get(string slug)
		{
			T ressource = await _repository.Get(slug);
			if (ressource == null)
				return NotFound();

			return ressource;
		}

		[HttpGet]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<T>>> GetAll([FromQuery] string sortBy,
			[FromQuery] int limit,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where)
		{
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");
			if (limit == 0)
				limit = 20;

			try
			{
				ICollection<T> ressources = await _repository.GetAll(ApiHelper.ParseWhere<T>(where),
					new Sort<T>(sortBy),
					new Pagination(limit, afterID));

				return new Page<T>(ressources,
					_baseURL + Request.Path,
					Request.Query.ToDictionary(x => x.Key, x => x.Value.ToString(), StringComparer.InvariantCultureIgnoreCase),
					limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}

		[HttpPost]
		[Authorize(Policy = "Write")]
		public async Task<ActionResult<T>> Create([FromBody] T ressource)
		{
			try
			{
				return await _repository.Create(ressource);
			}
			catch (DuplicatedItemException)
			{
				T existing = await _repository.Get(ressource.Slug);
				return Conflict(existing);
			}
		}

		[HttpPut("{id}")]
		[Authorize(Policy = "Write")]
		public async Task<ActionResult<T>> Edit(int id, [FromQuery] bool resetOld, [FromBody] T ressource)
		{
			ressource.ID = id;
			try
			{
				return await _repository.Edit(ressource, resetOld);
			}
			catch (ItemNotFound)
			{
				return NotFound();
			}
		}
		
		[HttpPut("{slug}")]
		[Authorize(Policy = "Write")]
		public async Task<ActionResult<T>> Edit(string slug, [FromQuery] bool resetOld, [FromBody] T ressource)
		{
			T old = await _repository.Get(slug);
			if (old == null)
				return NotFound();
			ressource.ID = old.ID;
			return await _repository.Edit(ressource, resetOld);
		}

		[HttpDelete("{id}")]
		[Authorize(Policy = "Write")]
		public async Task<IActionResult> Delete(int id)
		{
			try
			{
				await _repository.Delete(id);
			}
			catch (ItemNotFound)
			{
				return NotFound();
			}

			return Ok();
		}
		
		[HttpDelete("{slug}")]
		[Authorize(Policy = "Write")]
		public async Task<IActionResult> Delete(string slug)
		{
			try
			{
				await _repository.Delete(slug);
			}
			catch (ItemNotFound)
			{
				return NotFound();
			}

			return Ok();
		}
	}
}