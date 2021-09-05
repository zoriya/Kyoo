using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using Autofac.Features.Metadata;
using Autofac.Features.OwnedInstances;
using JetBrains.Annotations;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Abstractions.Models.Exceptions;
using Kyoo.Core.Models.Options;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Kyoo.Core.Controllers
{
	/// <summary>
	/// A service to handle long running tasks and a background runner.
	/// </summary>
	/// <remarks>Task will be queued, only one can run simultaneously.</remarks>
	public class TaskManager : BackgroundService, ITaskManager
	{
		/// <summary>
		/// The class representing task under this <see cref="TaskManager"/> jurisdiction.
		/// </summary>
		private class ManagedTask
		{
			/// <summary>
			/// The metadata for this task (the slug, and other useful information).
			/// </summary>
			public TaskMetadataAttribute Metadata { get; set; }

			/// <summary>
			/// The function used to create the task object.
			/// </summary>
			public Func<Owned<ITask>> Factory { get; init; }

			/// <summary>
			/// The next scheduled date for this task
			/// </summary>
			public DateTime ScheduledDate { get; set; }
		}

		/// <summary>
		/// A class representing a task inside the <see cref="TaskManager._queuedTasks"/> list.
		/// </summary>
		private class QueuedTask
		{
			/// <summary>
			/// The task currently queued.
			/// </summary>
			public ManagedTask Task { get; init; }

			/// <summary>
			/// The progress reporter that this task should use. 
			/// </summary>
			public IProgress<float> ProgressReporter { get; init; }

			/// <summary>
			/// The arguments to give to run the task with.
			/// </summary>
			public Dictionary<string, object> Arguments { get; init; }

			/// <summary>
			/// A token informing the task that it should be cancelled or not.
			/// </summary>
			public CancellationToken? CancellationToken { get; init; }
		}

		/// <summary>
		/// The configuration instance used to get schedule information
		/// </summary>
		private readonly IOptionsMonitor<TaskOptions> _options;

		/// <summary>
		/// The logger instance.
		/// </summary>
		private readonly ILogger<TaskManager> _logger;

		/// <summary>
		/// The list of tasks and their next scheduled run.
		/// </summary>
		private readonly List<ManagedTask> _tasks;

		/// <summary>
		/// The queue of tasks that should be run as soon as possible.
		/// </summary>
		private readonly Queue<QueuedTask> _queuedTasks = new();

		/// <summary>
		/// The currently running task.
		/// </summary>
		private (TaskMetadataAttribute, ITask)? _runningTask;

		/// <summary>
		/// The cancellation token used to cancel the running task when the runner should shutdown.
		/// </summary>
		private readonly CancellationTokenSource _taskToken = new();

		/// <summary>
		/// Create a new <see cref="TaskManager"/>.
		/// </summary>
		/// <param name="tasks">The list of tasks to manage with their metadata</param>
		/// <param name="options">The configuration to load schedule information.</param>
		/// <param name="logger">The logger.</param>
		public TaskManager(IEnumerable<Meta<Func<Owned<ITask>>, TaskMetadataAttribute>> tasks,
			IOptionsMonitor<TaskOptions> options,
			ILogger<TaskManager> logger)
		{
			_options = options;
			_logger = logger;
			_tasks = tasks.Select(x => new ManagedTask
			{
				Factory = x.Value,
				Metadata = x.Metadata,
				ScheduledDate = GetNextTaskDate(x.Metadata.Slug)
			}).ToList();

			if (_tasks.Any())
				_logger.LogTrace("Task manager initiated with: {Tasks}", _tasks.Select(x => x.Metadata.Name));
			else
				_logger.LogInformation("Task manager initiated without any tasks");
		}

		/// <summary>
		/// Triggered when the application host is ready to start the service.
		/// </summary>
		/// <remarks>Start the runner in another thread.</remarks>
		/// <param name="cancellationToken">Indicates that the start process has been aborted.</param>
		public override Task StartAsync(CancellationToken cancellationToken)
		{
			Task.Run(() => base.StartAsync(cancellationToken), CancellationToken.None);
			return Task.CompletedTask;
		}

		/// <inheritdoc />
		public override Task StopAsync(CancellationToken cancellationToken)
		{
			_taskToken.Cancel();
			return base.StopAsync(cancellationToken);
		}

		/// <summary>
		/// The runner that will host tasks and run queued tasks.
		/// </summary>
		/// <param name="cancellationToken">A token to stop the runner</param>
		protected override async Task ExecuteAsync(CancellationToken cancellationToken)
		{
			_EnqueueStartupTasks();

			while (!cancellationToken.IsCancellationRequested)
			{
				if (_queuedTasks.Any())
				{
					QueuedTask task = _queuedTasks.Dequeue();
					try
					{
						await _RunTask(task.Task, task.ProgressReporter, task.Arguments, task.CancellationToken);
					}
					catch (TaskFailedException ex)
					{
						_logger.LogWarning("The task \"{Task}\" failed: {Message}",
							task.Task.Metadata.Name, ex.Message);
					}
					catch (Exception e)
					{
						_logger.LogError(e, "An unhandled exception occured while running the task {Task}",
							task.Task.Metadata.Name);
					}
				}
				else
				{
					await Task.Delay(1000, cancellationToken);
					QueueScheduledTasks();
				}
			}
		}

		/// <summary>
		/// Parse parameters, inject a task and run it.
		/// </summary>
		/// <param name="task">The task to run</param>
		/// <param name="progress">A progress reporter to know the percentage of completion of the task.</param>
		/// <param name="arguments">The arguments to pass to the function</param>
		/// <param name="cancellationToken">An optional cancellation token that will be passed to the task.</param>
		/// <exception cref="ArgumentException">
		/// If the number of arguments is invalid, if an argument can't be converted or if the task finds the argument
		/// invalid.
		/// </exception>
		private async Task _RunTask(ManagedTask task,
			[NotNull] IProgress<float> progress,
			Dictionary<string, object> arguments,
			CancellationToken? cancellationToken = null)
		{
			using (_logger.BeginScope("Task: {Task}", task.Metadata.Name))
			{
				await using Owned<ITask> taskObj = task.Factory.Invoke();
				ICollection<TaskParameter> all = taskObj.Value.GetParameters();

				_runningTask = (task.Metadata, taskObj.Value);
				ICollection<string> invalids = arguments.Keys
					.Where(x => all.All(y => x != y.Name))
					.ToArray();
				if (invalids.Any())
				{
					throw new ArgumentException($"{string.Join(", ", invalids)} are " +
						$"invalid arguments for the task {task.Metadata.Name}");
				}

				TaskParameters args = new(all
					.Select(x =>
					{
						object value = arguments
							.FirstOrDefault(y => string.Equals(y.Key, x.Name, StringComparison.OrdinalIgnoreCase))
							.Value;
						if (value == null && x.IsRequired)
							throw new ArgumentException($"The argument {x.Name} is required to run " +
								$"{task.Metadata.Name} but it was not specified.");
						return x.CreateValue(value ?? x.DefaultValue);
					}));

				_logger.LogInformation("Task starting: {Task} ({Parameters})",
					task.Metadata.Name, args.ToDictionary(x => x.Name, x => x.As<object>()));

				CancellationToken token = cancellationToken != null
					? CancellationTokenSource.CreateLinkedTokenSource(_taskToken.Token, cancellationToken.Value).Token
					: _taskToken.Token;
				await taskObj.Value.Run(args, progress, token);

				_logger.LogInformation("Task finished: {Task}", task.Metadata.Name);
				_runningTask = null;
			}
		}

		/// <summary>
		/// Start tasks that are scheduled for start.
		/// </summary>
		private void QueueScheduledTasks()
		{
			IEnumerable<string> tasksToQueue = _tasks.Where(x => x.ScheduledDate <= DateTime.Now)
				.Select(x => x.Metadata.Slug);
			foreach (string task in tasksToQueue)
			{
				_logger.LogDebug("Queuing task scheduled for running: {Task}", task);
				StartTask(task, new Progress<float>(), new Dictionary<string, object>());
			}
		}

		/// <summary>
		/// Queue startup tasks with respect to the priority rules.
		/// </summary>
		private void _EnqueueStartupTasks()
		{
			IEnumerable<string> startupTasks = _tasks
				.Where(x => x.Metadata.RunOnStartup)
				.OrderByDescending(x => x.Metadata.Priority)
				.Select(x => x.Metadata.Slug);
			foreach (string task in startupTasks)
				StartTask(task, new Progress<float>(), new Dictionary<string, object>());
		}

		/// <inheritdoc />
		public void StartTask(string taskSlug,
			IProgress<float> progress,
			Dictionary<string, object> arguments = null,
			CancellationToken? cancellationToken = null)
		{
			arguments ??= new Dictionary<string, object>();

			int index = _tasks.FindIndex(x => x.Metadata.Slug == taskSlug);
			if (index == -1)
				throw new ItemNotFoundException($"No task found with the slug {taskSlug}");
			_queuedTasks.Enqueue(new QueuedTask
			{
				Task = _tasks[index],
				ProgressReporter = progress,
				Arguments = arguments,
				CancellationToken = cancellationToken
			});
			_tasks[index].ScheduledDate = GetNextTaskDate(taskSlug);
		}

		/// <inheritdoc />
		public void StartTask<T>(IProgress<float> progress,
			Dictionary<string, object> arguments = null,
			CancellationToken? cancellationToken = null)
			where T : ITask
		{
			TaskMetadataAttribute metadata = typeof(T).GetCustomAttribute<TaskMetadataAttribute>();
			if (metadata == null)
				throw new ArgumentException($"No metadata found on the given task (type: {typeof(T).Name}).");
			StartTask(metadata.Slug, progress, arguments, cancellationToken);
		}

		/// <summary>
		/// Get the next date of the execution of the given task.
		/// </summary>
		/// <param name="taskSlug">The slug of the task</param>
		/// <returns>The next date.</returns>
		private DateTime GetNextTaskDate(string taskSlug)
		{
			if (_options.CurrentValue.Scheduled.TryGetValue(taskSlug, out TimeSpan delay))
				return DateTime.Now + delay;
			return DateTime.MaxValue;
		}

		/// <inheritdoc />
		public ICollection<(TaskMetadataAttribute, ITask)> GetRunningTasks()
		{
			return _runningTask == null
				? ArraySegment<(TaskMetadataAttribute, ITask)>.Empty
				: new[] { _runningTask.Value };
		}

		/// <inheritdoc />
		public ICollection<TaskMetadataAttribute> GetAllTasks()
		{
			return _tasks.Select(x => x.Metadata).ToArray();
		}
	}
}
