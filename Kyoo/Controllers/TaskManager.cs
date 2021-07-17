using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using JetBrains.Annotations;
using Kyoo.Models.Attributes;
using Kyoo.Models.Exceptions;
using Kyoo.Models.Options;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Kyoo.Controllers
{
	/// <summary>
	/// A service to handle long running tasks and a background runner.
	/// </summary>
	/// <remarks>Task will be queued, only one can run simultaneously.</remarks>
	public class TaskManager : BackgroundService, ITaskManager
	{
		/// <summary>
		/// The service provider used to activate 
		/// </summary>
		private readonly IServiceProvider _provider;
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
		private readonly List<(ITask task, DateTime scheduledDate)> _tasks;
		/// <summary>
		/// The queue of tasks that should be run as soon as possible.
		/// </summary>
		private readonly Queue<(ITask, IProgress<float>, Dictionary<string, object>)> _queuedTasks = new();
		/// <summary>
		/// The currently running task.
		/// </summary>
		private ITask _runningTask;
		/// <summary>
		/// The cancellation token used to cancel the running task when the runner should shutdown.
		/// </summary>
		private readonly CancellationTokenSource _taskToken = new();


		/// <summary>
		/// Create a new <see cref="TaskManager"/>.
		/// </summary>
		/// <param name="tasks">The list of tasks to manage</param>
		/// <param name="provider">The service provider to request services for tasks</param>
		/// <param name="options">The configuration to load schedule information.</param>
		/// <param name="logger">The logger.</param>
		public TaskManager(IEnumerable<ITask> tasks,
			IServiceProvider provider, 
			IOptionsMonitor<TaskOptions> options,
			ILogger<TaskManager> logger)
		{
			_provider = provider;
			_options = options;
			_logger = logger;
			_tasks = tasks.Select(x => (x, GetNextTaskDate(x.Slug))).ToList();
			
			if (_tasks.Any())
				_logger.LogTrace("Task manager initiated with: {Tasks}", _tasks.Select(x => x.task.Name));
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
			EnqueueStartupTasks();
			
			while (!cancellationToken.IsCancellationRequested)
			{
				if (_queuedTasks.Any())
				{
					(ITask task, IProgress<float> progress, Dictionary<string, object> args) = _queuedTasks.Dequeue();
					_runningTask = task;
					try
					{
						await RunTask(task, progress, args);
					}
					catch (Exception e)
					{
						_logger.LogError(e, "An unhandled exception occured while running the task {Task}", task.Name);
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
		/// <exception cref="ArgumentException">
		/// If the number of arguments is invalid, if an argument can't be converted or if the task finds the argument
		/// invalid.
		/// </exception>
		private async Task RunTask(ITask task, 
			[NotNull] IProgress<float> progress,
			Dictionary<string, object> arguments)
		{
			_logger.LogInformation("Task starting: {Task}", task.Name);
			
			ICollection<TaskParameter> all = task.GetParameters();

			ICollection<string> invalids = arguments.Keys
				.Where(x => all.All(y => x != y.Name))
				.ToArray();
			if (invalids.Any())
			{
				string invalidsStr = string.Join(", ", invalids);
				throw new ArgumentException($"{invalidsStr} are invalid arguments for the task {task.Name}");
			}
			
			TaskParameters args = new(all
				.Select(x =>
				{
					object value = arguments
						.FirstOrDefault(y => string.Equals(y.Key, x.Name, StringComparison.OrdinalIgnoreCase))
						.Value;
					if (value == null && x.IsRequired)
						throw new ArgumentException($"The argument {x.Name} is required to run {task.Name}" +
						                            " but it was not specified.");
					return x.CreateValue(value ?? x.DefaultValue);
				}));

			using IServiceScope scope = _provider.CreateScope();
			InjectServices(task, x => scope.ServiceProvider.GetRequiredService(x));
			await task.Run(args, progress, _taskToken.Token);
			InjectServices(task, _ => null);
			_logger.LogInformation("Task finished: {Task}", task.Name);
		}

		/// <summary>
		/// Inject services into the <see cref="InjectedAttribute"/> marked properties of the given object.
		/// </summary>
		/// <param name="obj">The object to inject</param>
		/// <param name="retrieve">The function used to retrieve services. (The function is called immediately)</param>
		private static void InjectServices(ITask obj, [InstantHandle] Func<Type, object> retrieve)
		{
			IEnumerable<PropertyInfo> properties = obj.GetType().GetProperties()
				.Where(x => x.GetCustomAttribute<InjectedAttribute>() != null)
				.Where(x => x.CanWrite);

			foreach (PropertyInfo property in properties)
				property.SetValue(obj, retrieve(property.PropertyType));
		}
		
		/// <summary>
		/// Start tasks that are scheduled for start.
		/// </summary>
		private void QueueScheduledTasks()
		{
			IEnumerable<string> tasksToQueue = _tasks.Where(x => x.scheduledDate <= DateTime.Now)
				.Select(x => x.task.Slug);
			foreach (string task in tasksToQueue)
			{
				_logger.LogDebug("Queuing task scheduled for running: {Task}", task);
				StartTask(task, new Progress<float>(), new Dictionary<string, object>());
			}
		}

		/// <summary>
		/// Queue startup tasks with respect to the priority rules.
		/// </summary>
		private void EnqueueStartupTasks()
		{
			IEnumerable<ITask> startupTasks = _tasks.Select(x => x.task)
				.Where(x => x.RunOnStartup)
				.OrderByDescending(x => x.Priority);
			foreach (ITask task in startupTasks)
				_queuedTasks.Enqueue((task, new Progress<float>(), new Dictionary<string, object>()));
		}

		/// <inheritdoc />
		public void StartTask(string taskSlug, 
			IProgress<float> progress,
			Dictionary<string, object> arguments = null,
			CancellationToken? cancellationToken = null)
		{
			arguments ??= new Dictionary<string, object>();
			
			int index = _tasks.FindIndex(x => x.task.Slug == taskSlug);
			if (index == -1)
				throw new ItemNotFoundException($"No task found with the slug {taskSlug}");
			_queuedTasks.Enqueue((_tasks[index].task, progress, arguments));
			_tasks[index] = (_tasks[index].task, GetNextTaskDate(taskSlug));
		}

		/// <inheritdoc />
		public void StartTask<T>(IProgress<float> progress, 
			Dictionary<string, object> arguments = null,
			CancellationToken? cancellationToken = null)
			where T : ITask, new()
		{
			StartTask(new T().Slug, progress, arguments, cancellationToken);
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
		public ICollection<ITask> GetRunningTasks()
		{
			return new[] {_runningTask};
		}

		/// <inheritdoc />
		public ICollection<ITask> GetAllTasks()
		{
			return _tasks.Select(x => x.task).ToArray();
		}
	}
}