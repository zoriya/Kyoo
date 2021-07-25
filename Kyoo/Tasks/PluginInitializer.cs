using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Kyoo.Common.Models.Attributes;
using Kyoo.Controllers;

namespace Kyoo.Tasks
{
	/// <summary>
	/// A task run on Kyoo's startup to initialize plugins
	/// </summary>
	[TaskMetadata("plugin-init", "Plugin Initializer", "A task to initialize plugins.", 
		RunOnStartup = true, Priority = int.MaxValue, IsHidden = true)]
	public class PluginInitializer : ITask
	{
		/// <summary>
		/// The plugin manager used to retrieve plugins to initialize them.
		/// </summary>
		private readonly IPluginManager _pluginManager;
		/// <summary>
		/// The service provider given to each <see cref="IPlugin.Initialize"/> method.
		/// </summary>
		private readonly IServiceProvider _provider;

		/// <summary>
		/// Create a new <see cref="PluginInitializer"/> task
		/// </summary>
		/// <param name="pluginManager">The plugin manager used to retrieve plugins to initialize them.</param>
		/// <param name="provider">The service provider given to each <see cref="IPlugin.Initialize"/> method.</param>
		public PluginInitializer(IPluginManager pluginManager, IServiceProvider provider)
		{
			_pluginManager = pluginManager;
			_provider = provider;
		}
		

		/// <inheritdoc />
		public TaskParameters GetParameters()
		{
			return new();
		}
		
		/// <inheritdoc />
		public Task Run(TaskParameters arguments, IProgress<float> progress, CancellationToken cancellationToken)
		{
			ICollection<IPlugin> plugins = _pluginManager.GetAllPlugins();
			int count = 0;
			progress.Report(0);

			foreach (IPlugin plugin in plugins)
			{
				plugin.Initialize(_provider);
				
				progress.Report(count / plugins.Count * 100);
				count++;
			}
			
			progress.Report(100);
			return Task.CompletedTask;
		}
	}
}