using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Tasks;
using Microsoft.Extensions.Hosting;

namespace Kyoo.Controllers
{
	public class TaskManager : BackgroundService, ITaskManager
	{
		private readonly IServiceProvider _serviceProvider;
		private readonly IPluginManager _pluginManager;
		
		private List<ITask> _tasks = new List<ITask>();
		private CancellationTokenSource _taskToken = new CancellationTokenSource();
		private ITask _runningTask;
		private Queue<(ITask, string)> _queuedTasks = new Queue<(ITask, string)>();
		
		public TaskManager(IServiceProvider serviceProvider, IPluginManager pluginManager)
		{
			_serviceProvider = serviceProvider;
			_pluginManager = pluginManager;
		}
		
		protected override async Task ExecuteAsync(CancellationToken cancellationToken)
		{
			while (!cancellationToken.IsCancellationRequested)
			{
				if (_queuedTasks.Any())
				{
					(ITask task, string arguments) = _queuedTasks.Dequeue();
					_runningTask = task;
					await task.Run(_serviceProvider, _taskToken.Token, arguments);
				}
				else
				{
					
					await Task.Delay(1000_000, cancellationToken);
				}
			}
		}

		public override Task StartAsync(CancellationToken cancellationToken)
		{
			ReloadTask();
			foreach (ITask task in _tasks.Where(x => x.RunOnStartup && x.Priority != Int32.MaxValue).OrderByDescending(x => x.Priority))
				_queuedTasks.Enqueue((task, null));
			return base.StartAsync(cancellationToken);
		}

		public override Task StopAsync(CancellationToken cancellationToken)
		{
			_taskToken.Cancel();
			return base.StopAsync(cancellationToken);
		}

		public bool StartTask(string taskSlug, string arguments = null)
		{
			ITask task = _tasks.FirstOrDefault(x => x.Slug == taskSlug);
			if (task == null)
				return false;
			_queuedTasks.Enqueue((task, arguments));
			return true;
		}
		
		public ITask GetRunningTask()
		{
			return _runningTask;
		}

		public void ReloadTask()
		{
			_tasks.Clear();
			_tasks.AddRange(CoreTaskHolder.Tasks);
			foreach (ITask task in _tasks.Where(x => x.RunOnStartup && x.Priority == Int32.MaxValue))
				task.Run(_serviceProvider, _taskToken.Token);
			foreach (IPlugin plugin in _pluginManager.GetAllPlugins())
				_tasks.AddRange(plugin.Tasks);
		}

		public IEnumerable<ITask> GetAllTasks()
		{
			return _tasks;
		}
	}
}