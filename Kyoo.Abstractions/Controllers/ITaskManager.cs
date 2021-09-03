using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Threading;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Abstractions.Models.Exceptions;

namespace Kyoo.Abstractions.Controllers
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
		/// <param name="taskSlug">
		/// The slug of the task to run.
		/// </param>
		/// <param name="progress">
		/// A progress reporter to know the percentage of completion of the task.
		/// </param>
		/// <param name="arguments">
		/// A list of arguments to pass to the task. An automatic conversion will be made if arguments to not fit.
		/// </param>
		/// <param name="cancellationToken">
		/// A custom cancellation token for the task.
		/// </param>
		/// <exception cref="ArgumentException">
		/// If the number of arguments is invalid, if an argument can't be converted or if the task finds the argument
		/// invalid.
		/// </exception>
		/// <exception cref="ItemNotFoundException">
		/// The task could not be found.
		/// </exception>
		void StartTask(string taskSlug,
			[NotNull] IProgress<float> progress,
			Dictionary<string, object> arguments = null,
			CancellationToken? cancellationToken = null);

		/// <summary>
		/// Start a new task (or queue it).
		/// </summary>
		/// <param name="progress">
		/// A progress reporter to know the percentage of completion of the task.
		/// </param>
		/// <param name="arguments">
		/// A list of arguments to pass to the task. An automatic conversion will be made if arguments to not fit.
		/// </param>
		/// <typeparam name="T">
		/// The type of the task to start.
		/// </typeparam>
		/// <param name="cancellationToken">
		/// A custom cancellation token for the task.
		/// </param>
		/// <exception cref="ArgumentException">
		/// If the number of arguments is invalid, if an argument can't be converted or if the task finds the argument
		/// invalid.
		/// </exception>
		/// <exception cref="ItemNotFoundException">
		/// The task could not be found.
		/// </exception>
		void StartTask<T>([NotNull] IProgress<float> progress,
			Dictionary<string, object> arguments = null,
			CancellationToken? cancellationToken = null)
			where T : ITask;

		/// <summary>
		/// Get all currently running tasks
		/// </summary>
		/// <returns>A list of currently running tasks.</returns>
		ICollection<(TaskMetadataAttribute, ITask)> GetRunningTasks();

		/// <summary>
		/// Get all available tasks
		/// </summary>
		/// <returns>A list of every tasks that this instance know.</returns>
		ICollection<TaskMetadataAttribute> GetAllTasks();
	}
}