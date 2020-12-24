using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace Kyoo.Controllers
{
	public class TaskManager : BackgroundService, ITaskManager
	{
		private readonly IServiceProvider _serviceProvider;
		private readonly IPluginManager _pluginManager;
		private readonly IConfiguration _configuration;
		
		private List<(ITask task, DateTime scheduledDate)> _tasks = new List<(ITask, DateTime)>();
		private CancellationTokenSource _taskToken = new CancellationTokenSource();
		private ITask _runningTask;
		private Queue<(ITask, string)> _queuedTasks = new Queue<(ITask, string)>();
		
		public TaskManager(IServiceProvider serviceProvider, IPluginManager pluginManager, IConfiguration configuration)
		{
			_serviceProvider = serviceProvider;
			_pluginManager = pluginManager;
			_configuration = configuration;
		}
		
		protected override async Task ExecuteAsync(CancellationToken cancellationToken)
		{
			ReloadTask();

			IEnumerable<ITask> startupTasks = _tasks.Select(x => x.task)
				.Where(x => x.RunOnStartup && x.Priority != Int32.MaxValue)
				.OrderByDescending(x => x.Priority);
			foreach (ITask task in startupTasks)
				_queuedTasks.Enqueue((task, null));
			
			while (!cancellationToken.IsCancellationRequested)
			{
				if (_queuedTasks.Any())
				{
					(ITask task, string arguments) = _queuedTasks.Dequeue();
					_runningTask = task;
					try
					{
						await task.Run(_serviceProvider, _taskToken.Token, arguments);
					}
					catch (Exception e)
					{
						Console.Error.WriteLine($"An unhandled exception occured while running the task {task.Name}.\nInner exception: {e.Message}\n\n");
					}
				}
				else
				{
					await Task.Delay(1000, cancellationToken);
					QueueScheduledTasks();
				}
			}
		}

		private void QueueScheduledTasks()
		{
			IEnumerable<string> tasksToQueue = _tasks.Where(x => x.scheduledDate <= DateTime.Now)
				.Select(x => x.task.Slug);
			foreach (string task in tasksToQueue)
				StartTask(task);
		}

		public override Task StartAsync(CancellationToken cancellationToken)
		{
			Task.Run(() => base.StartAsync(cancellationToken));
			return Task.CompletedTask;
		}

		public override Task StopAsync(CancellationToken cancellationToken)
		{
			_taskToken.Cancel();
			return base.StopAsync(cancellationToken);
		}

		public bool StartTask(string taskSlug, string arguments = null)
		{
			int index = _tasks.FindIndex(x => x.task.Slug == taskSlug);
			if (index == -1)
				return false;
			_queuedTasks.Enqueue((_tasks[index].task, arguments));
			_tasks[index] = (_tasks[index].task, DateTime.Now + GetTaskDelay(taskSlug));
			return true;
		}

		public TimeSpan GetTaskDelay(string taskSlug)
		{
			TimeSpan delay = _configuration.GetSection("scheduledTasks").GetValue<TimeSpan>(taskSlug);
			if (delay == default)
				delay = TimeSpan.FromDays(365);
			return delay;
		}
		
		public ITask GetRunningTask()
		{
			return _runningTask;
		}

		public void ReloadTask()
		{
			_tasks.Clear();
			_tasks.AddRange(CoreTaskHolder.Tasks.Select(x => (x, DateTime.Now + GetTaskDelay(x.Slug))));
			
			IEnumerable<ITask> prerunTasks = _tasks.Select(x => x.task)
				.Where(x => x.RunOnStartup && x.Priority == Int32.MaxValue);
			
			foreach (ITask task in prerunTasks)
				task.Run(_serviceProvider, _taskToken.Token);
			foreach (IPlugin plugin in _pluginManager.GetAllPlugins())
				if (plugin.Tasks != null)
					_tasks.AddRange(plugin.Tasks.Select(x => (x, DateTime.Now + GetTaskDelay(x.Slug))));
		}

		public IEnumerable<ITask> GetAllTasks()
		{
			return _tasks.Select(x => x.task);
		}
	}
}