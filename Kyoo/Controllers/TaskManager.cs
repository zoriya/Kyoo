using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using Kyoo.Models.Attributes;
using Kyoo.Models.Exceptions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Unity;

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
		private readonly IUnityContainer _container;
		/// <summary>
		/// The configuration instance used to get schedule informations
		/// </summary>
		private readonly IConfiguration _configuration;
		/// <summary>
		/// The logger instance.
		/// </summary>
		private readonly ILogger<TaskManager> _logger;

		/// <summary>
		/// The list of tasks and their next scheduled run.
		/// </summary>
		private List<(ITask task, DateTime scheduledDate)> _tasks;
		/// <summary>
		/// The queue of tasks that should be runned as soon as possible.
		/// </summary>
		private readonly Queue<(ITask, Dictionary<string, object>)> _queuedTasks = new();
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
		/// <param name="container">The service provider to request services for tasks</param>
		/// <param name="configuration">The configuration to load schedule information.</param>
		/// <param name="logger">The logger.</param>
		public TaskManager(IEnumerable<ITask> tasks,
			IUnityContainer container, 
			IConfiguration configuration,
			ILogger<TaskManager> logger)
		{
			_container = container;
			_configuration = configuration.GetSection("scheduledTasks");
			_logger = logger;
			_tasks = tasks.Select(x => (x, DateTime.Now + GetTaskDelay(x.Slug))).ToList();
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
					(ITask task, Dictionary<string, object> arguments) = _queuedTasks.Dequeue();
					_runningTask = task;
					try
					{
						ICollection<TaskParameter> all = task.GetParameters();
						TaskParameters args = new(arguments
							.Select(x => (value: x, arg: all
								.FirstOrDefault(y => string.Equals(y.Name, x.Key, StringComparison.OrdinalIgnoreCase))))
							.Select(x =>
							{
								if (x.arg == null)
									throw new ArgumentException($"Invalid argument name: {x.value.Key}");
								return x.arg.CreateValue(x.value.Value);
							}));
						
						
						_logger.LogInformation("Task starting: {Task}", task.Name);
						InjectServices(task);
						await task.Run(args, _taskToken.Token);
						_logger.LogInformation("Task finished: {Task}", task.Name);
					}
					catch (Exception e)
					{
						_logger.LogError("An unhandled exception occured while running the task {Task}.\n" +
						                 "Inner exception: {Exception}\n\n", task.Name, e.Message);
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
		/// Inject services into the <see cref="InjectedAttribute"/> marked properties of the given object.
		/// </summary>
		/// <param name="obj">The object to inject</param>
		/// <typeparam name="T">The type of the object.</typeparam>
		private void InjectServices<T>(T obj)
		{
			IEnumerable<PropertyInfo> properties = typeof(T).GetProperties()
				.Where(x => x.GetCustomAttribute<InjectedAttribute>() != null)
				.Where(x => x.CanWrite);

			foreach (PropertyInfo property in properties)
			{
				object value = _container.Resolve(property.PropertyType);
				property.SetValue(obj, value);
			}
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
				StartTask(task, new Dictionary<string, object>());
			}
		}

		/// <summary>
		/// Queue startup tasks with respect to the priority rules.
		/// </summary>
		private void EnqueueStartupTasks()
		{
			IEnumerable<ITask> startupTasks = _tasks.Select(x => x.task)
				.Where(x => x.RunOnStartup && x.Priority != int.MaxValue)
				.OrderByDescending(x => x.Priority);
			foreach (ITask task in startupTasks)
				_queuedTasks.Enqueue((task, null));
		}

		/// <inheritdoc />
		public void StartTask(string taskSlug, Dictionary<string, object> arguments = null)
		{
			arguments ??= new Dictionary<string, object>();
			
			int index = _tasks.FindIndex(x => x.task.Slug == taskSlug);
			if (index == -1)
				throw new ItemNotFound($"No task found with the slug {taskSlug}");
			_queuedTasks.Enqueue((_tasks[index].task, arguments));
			_tasks[index] = (_tasks[index].task, DateTime.Now + GetTaskDelay(taskSlug));
		}

		/// <summary>
		/// Get the delay of a task
		/// </summary>
		/// <param name="taskSlug">The slug of the task</param>
		/// <returns>The delay of the task.</returns>
		private TimeSpan GetTaskDelay(string taskSlug)
		{
			TimeSpan delay = _configuration.GetValue<TimeSpan>(taskSlug);
			if (delay == default)
				delay = TimeSpan.MaxValue;
			return delay;
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

		/// <inheritdoc />
		public void ReloadTasks()
		{
			_tasks = _container.Resolve<IEnumerable<ITask>>().Select(x => (x, DateTime.Now + GetTaskDelay(x.Slug))).ToList();
			EnqueueStartupTasks();
		}
	}
}