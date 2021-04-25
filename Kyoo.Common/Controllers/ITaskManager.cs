using System;
using System.Collections.Generic;
using Kyoo.Models;
using Kyoo.Models.Exceptions;

namespace Kyoo.Controllers
{
	/// <summary>
	/// A service to handle long running tasks.
	/// </summary>
	/// <remarks>The concurrent number of running tasks is implementation dependent.</remarks>
	public interface ITaskManager
	{
		/// <summary>
		/// Start a new task (or queue it).
		/// </summary>
		/// <param name="taskSlug">The slug of the task to run</param>
		/// <param name="arguments">A list of arguments to pass to the task. An automatic conversion will be made if arguments to not fit.</param>
		/// <exception cref="ArgumentException">If the number of arguments is invalid or if an argument can't be converted.</exception>
		/// <exception cref="ItemNotFound">The task could not be found.</exception>
		void StartTask(string taskSlug, Dictionary<string, object> arguments);
		
		/// <summary>
		/// Get all currently running tasks
		/// </summary>
		/// <returns>A list of currently running tasks.</returns>
		ICollection<ITask> GetRunningTasks();
		
		/// <summary>
		/// Get all availables tasks
		/// </summary>
		/// <returns>A list of every tasks that this instance know.</returns>
		ICollection<ITask> GetAllTasks();

		/// <summary>
		/// Reload tasks and run startup tasks.
		/// </summary>
		void ReloadTasks();
	}
}