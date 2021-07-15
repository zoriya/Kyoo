using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models.Attributes;

namespace Kyoo.Tasks
{
	/// <summary>
	/// A task run on Kyoo's startup to initialize plugins
	/// </summary>
	public class PluginInitializer : ITask
	{
		/// <inheritdoc />
		public string Slug => "plugin-init";
		
		/// <inheritdoc />
		public string Name => "PluginInitializer";

		/// <inheritdoc />
		public string Description => "A task to initialize plugins.";

		/// <inheritdoc />
		public string HelpMessage => null;

		/// <inheritdoc />
		public bool RunOnStartup => true;

		/// <inheritdoc />
		public int Priority => int.MaxValue;

		/// <inheritdoc />
		public bool IsHidden => true;


		/// <summary>
		/// The plugin manager used to retrieve plugins to initialize them.
		/// </summary>
		[Injected] public IPluginManager PluginManager { private get; set; }
		/// <summary>
		/// The service provider given to each <see cref="IPlugin.Initialize"/> method.
		/// </summary>
		[Injected] public IServiceProvider Provider { private get; set; }
		
		/// <inheritdoc />
		public Task Run(TaskParameters arguments, IProgress<float> progress, CancellationToken cancellationToken)
		{
			ICollection<IPlugin> plugins = PluginManager.GetAllPlugins();
			int count = 0;
			progress.Report(0);

			foreach (IPlugin plugin in plugins)
			{
				plugin.Initialize(Provider);
				
				progress.Report(count / plugins.Count * 100);
				count++;
			}
			
			progress.Report(100);
			return Task.CompletedTask;
		}

		/// <inheritdoc />
		public TaskParameters GetParameters()
		{
			return new();
		}
	}
}