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
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Abstractions.Models.Permissions;
using Kyoo.Abstractions.Models.Utils;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using static Kyoo.Abstractions.Models.Utils.Constants;

namespace Kyoo.Core.Api
{
	/// <summary>
	/// An endpoint to list and run tasks in the background.
	/// </summary>
	[Route("tasks")]
	[Route("task", Order = AlternativeRoute)]
	[ApiController]
	[ResourceView]
	[PartialPermission("Task", Group = Group.Admin)]
	[ApiDefinition("Tasks", Group = AdminGroup)]
	public class TaskApi : ControllerBase
	{
		/// <summary>
		/// The task manager used to retrieve and start tasks.
		/// </summary>
		private readonly ITaskManager _taskManager;

		/// <summary>
		/// Create a new <see cref="TaskApi"/>.
		/// </summary>
		/// <param name="taskManager">The task manager used to start tasks.</param>
		public TaskApi(ITaskManager taskManager)
		{
			_taskManager = taskManager;
		}

		/// <summary>
		/// Get all tasks
		/// </summary>
		/// <remarks>
		/// Retrieve all tasks available in this instance of Kyoo.
		/// </remarks>
		/// <returns>A list of every tasks that this instance know.</returns>
		[HttpGet]
		[PartialPermission(Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		public ActionResult<ICollection<ITask>> GetTasks()
		{
			return Ok(_taskManager.GetAllTasks());
		}

		/// <summary>
		/// Start task
		/// </summary>
		/// <remarks>
		/// Start a task with the given arguments. If a task is already running, it may be queued and started only when
		/// a runner become available.
		/// </remarks>
		/// <param name="taskSlug">The slug of the task to start.</param>
		/// <param name="args">The list of arguments to give to the task.</param>
		/// <returns>The task has been started or is queued.</returns>
		/// <response code="400">The task misses an argument or an argument is invalid.</response>
		/// <response code="404">No task could be found with the given slug.</response>
		[HttpPut("{taskSlug}")]
		[HttpGet("{taskSlug}", Order = AlternativeRoute)]
		[PartialPermission(Kind.Create)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public IActionResult RunTask(string taskSlug,
			[FromQuery] Dictionary<string, object> args)
		{
			_taskManager.StartTask(taskSlug, new Progress<float>(), args);
			return Ok();
		}
	}
}
