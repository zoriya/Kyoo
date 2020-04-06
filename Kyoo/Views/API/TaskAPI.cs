using Microsoft.AspNetCore.Mvc;
using Kyoo.Controllers;
using Microsoft.AspNetCore.Authorization;

namespace Kyoo.Api
{
	[Route("api/[controller]")]
	[ApiController]
	public class TaskController : ControllerBase
	{
		private readonly ITaskManager _taskManager;

		public TaskController(ITaskManager taskManager)
		{
			_taskManager = taskManager;
		}
		
		
		[HttpGet("{taskSlug}")]
		[Authorize(Policy="Admin")]
		public IActionResult RunTask(string taskSlug)
		{
			if (_taskManager.StartTask(taskSlug))
				return Ok();
			return NotFound();
		}
	}
}
