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
		
		
		[HttpGet("{taskSlug}/{*args}")]
		[Authorize(Policy="Admin")]
		public IActionResult RunTask(string taskSlug, string args = null)
		{
			if (_taskManager.StartTask(taskSlug, args))
				return Ok();
			return NotFound();
		}
	}
}
