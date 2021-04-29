using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Kyoo.Controllers;
using Kyoo.Models.Exceptions;
using Microsoft.AspNetCore.Authorization;

namespace Kyoo.Api
{
	[Route("api/task")]
	[Route("api/tasks")]
	[ApiController]
	[Authorize(Policy="Admin")]
	public class TaskApi : ControllerBase
	{
		private readonly ITaskManager _taskManager;

		public TaskApi(ITaskManager taskManager)
		{
			_taskManager = taskManager;
		}


		[HttpGet]
		public ActionResult<ICollection<ITask>> GetTasks()
		{
			return Ok(_taskManager.GetAllTasks());
		}
		
		[HttpGet("{taskSlug}")]
		[HttpPut("{taskSlug}")]
		public IActionResult RunTask(string taskSlug, [FromQuery] Dictionary<string, object> args)
		{
			try
			{
				_taskManager.StartTask(taskSlug, args);
				return Ok();
			}
			catch (ItemNotFoundException)
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
