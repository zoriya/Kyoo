using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Exceptions;
using Kyoo.Abstractions.Models.Permissions;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Api
{
	[ApiController]
	[ResourceView]
	public class CrudApi<T> : ControllerBase where T : class, IResource
	{
		private readonly IRepository<T> _repository;
		protected readonly string BaseURL;

		public CrudApi(IRepository<T> repository, string baseURL)
		{
			_repository = repository;
			BaseURL = baseURL;
		}


		[HttpGet("{id:int}")]
		[PartialPermission(Kind.Read)]
		public virtual async Task<ActionResult<T>> Get(int id)
		{
			T ret = await _repository.GetOrDefault(id);
			if (ret == null)
				return NotFound();
			return ret;
		}

		[HttpGet("{slug}")]
		[PartialPermission(Kind.Read)]
		public virtual async Task<ActionResult<T>> Get(string slug)
		{
			T ret = await _repository.GetOrDefault(slug);
			if (ret == null)
				return NotFound();
			return ret;
		}

		[HttpGet("count")]
		[PartialPermission(Kind.Read)]
		public virtual async Task<ActionResult<int>> GetCount([FromQuery] Dictionary<string, string> where)
		{
			try
			{
				return await _repository.GetCount(ApiHelper.ParseWhere<T>(where));
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}
		
		[HttpGet]
		[PartialPermission(Kind.Read)]
		public virtual async Task<ActionResult<Page<T>>> GetAll([FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 20)
		{
			try
			{
				ICollection<T> resources = await _repository.GetAll(ApiHelper.ParseWhere<T>(where),
					new Sort<T>(sortBy),
					new Pagination(limit, afterID));

				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}

		protected Page<TResult> Page<TResult>(ICollection<TResult> resources, int limit)
			where TResult : IResource
		{
			return new(resources, 
				BaseURL + Request.Path,
				Request.Query.ToDictionary(x => x.Key, x => x.Value.ToString(), StringComparer.InvariantCultureIgnoreCase),
				limit);
		}

		[HttpPost]
		[PartialPermission(Kind.Create)]
		public virtual async Task<ActionResult<T>> Create([FromBody] T resource)
		{
			try
			{
				return await _repository.Create(resource);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
			catch (DuplicatedItemException)
			{
				T existing = await _repository.GetOrDefault(resource.Slug);
				return Conflict(existing);
			}
		}
		
		[HttpPut]
		[PartialPermission(Kind.Write)]
		public virtual async Task<ActionResult<T>> Edit([FromQuery] bool resetOld, [FromBody] T resource)
		{
			try
			{
				if (resource.ID > 0)
					return await _repository.Edit(resource, resetOld);

				T old = await _repository.Get(resource.Slug);
				resource.ID = old.ID;
				return await _repository.Edit(resource, resetOld);
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
		}

		[HttpPut("{id:int}")]
		[PartialPermission(Kind.Write)]
		public virtual async Task<ActionResult<T>> Edit(int id, [FromQuery] bool resetOld, [FromBody] T resource)
		{
			resource.ID = id;
			try
			{
				return await _repository.Edit(resource, resetOld);
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
		}
		
		[HttpPut("{slug}")]
		[PartialPermission(Kind.Write)]
		public virtual async Task<ActionResult<T>> Edit(string slug, [FromQuery] bool resetOld, [FromBody] T resource)
		{
			try
			{
				T old = await _repository.Get(slug);
				resource.ID = old.ID;
				return await _repository.Edit(resource, resetOld);
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
		}

		[HttpDelete("{id:int}")]
		[PartialPermission(Kind.Delete)]
		public virtual async Task<IActionResult> Delete(int id)
		{
			try
			{
				await _repository.Delete(id);
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}

			return Ok();
		}
		
		[HttpDelete("{slug}")]
		[PartialPermission(Kind.Delete)]
		public virtual async Task<IActionResult> Delete(string slug)
		{
			try
			{
				await _repository.Delete(slug);
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}

			return Ok();
		}
		
		[PartialPermission(Kind.Delete)]
		public virtual async Task<IActionResult> Delete(Dictionary<string, string> where)
		{
			try
			{
				await _repository.DeleteAll(ApiHelper.ParseWhere<T>(where));
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}

			return Ok();
		}
	}
}