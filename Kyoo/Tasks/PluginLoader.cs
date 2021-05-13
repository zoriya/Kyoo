// using System;
// using System.Collections.Generic;
// using System.Threading;
// using System.Threading.Tasks;
// using Kyoo.Controllers;
// using Kyoo.Models;
// using Microsoft.Extensions.DependencyInjection;
//
// namespace Kyoo.Tasks
// {
// 	public class PluginLoader : ITask
// 	{
// 		public string Slug => "reload-plugin";
// 		public string Name => "Reload plugins";
// 		public string Description => "Reload all plugins from the plugin folder.";
// 		public string HelpMessage => null;
// 		public bool RunOnStartup => true;
// 		public int Priority => Int32.MaxValue;
// 		public Task Run(IServiceProvider serviceProvider, CancellationToken cancellationToken, string arguments = null)
// 		{
// 			using IServiceScope serviceScope = serviceProvider.CreateScope();
// 			IPluginManager pluginManager = serviceScope.ServiceProvider.GetService<IPluginManager>();
// 			pluginManager.ReloadPlugins();
// 			return Task.CompletedTask;
// 		}
//
// 		public Task<IEnumerable<string>> GetPossibleParameters()
// 		{
// 			return Task.FromResult<IEnumerable<string>>(null);
// 		}
//
// 		public int? Progress()
// 		{
// 			return null;
// 		}
// 	}
// }