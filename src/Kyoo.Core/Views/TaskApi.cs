// Kyoo - A portable and vast media library solution.
// Copyright (c) Kyoo.
//
// See AUTHORS.md and LICENSE file in the project root for full license information.
//
// Kyoo is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// any later version.
//
// Kyoo is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Kyoo. If not, see <https://www.gnu.org/licenses/>.

using System;
using System.Collections.Generic;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models.Exceptions;
using Kyoo.Abstractions.Models.Permissions;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Core.Api
{
	[Route("api/task")]
	[Route("api/tasks")]
	[ApiController]
	public class TaskApi : ControllerBase
	{
		private readonly ITaskManager _taskManager;

		public TaskApi(ITaskManager taskManager)
		{
			_taskManager = taskManager;
		}

		[HttpGet]
		[Permission(nameof(TaskApi), Kind.Read)]
		public ActionResult<ICollection<ITask>> GetTasks()
		{
			return Ok(_taskManager.GetAllTasks());
		}

		[HttpGet("{taskSlug}")]
		[HttpPut("{taskSlug}")]
		[Permission(nameof(TaskApi), Kind.Create)]
		public IActionResult RunTask(string taskSlug, [FromQuery] Dictionary<string, object> args)
		{
			try
			{
				_taskManager.StartTask(taskSlug, new Progress<float>(), args);
				return Ok();
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new { Error = ex.Message });
			}
		}
	}
}
