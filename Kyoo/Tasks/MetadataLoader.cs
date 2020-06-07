using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.Extensions.DependencyInjection;

namespace Kyoo.Tasks
{
	public class MetadataLoader : ITask
	{
		public string Slug => "reload-metdata";
		public string Name => "Reload Metadata Providers";
		public string Description => "Add every loaded metadata provider to the database.";
		public string HelpMessage => null;
		public bool RunOnStartup => true;
		public int Priority => 1000;
		
		public Task Run(IServiceProvider serviceProvider, CancellationToken cancellationToken, string arguments = null)
		{
			using IServiceScope serviceScope = serviceProvider.CreateScope();
			DatabaseContext database = serviceScope.ServiceProvider.GetService<DatabaseContext>();
			IPluginManager pluginManager = serviceScope.ServiceProvider.GetService<IPluginManager>();
			foreach (IMetadataProvider provider in pluginManager.GetPlugins<IMetadataProvider>())
				database.Providers.AddIfNotExist(provider.Provider, x => x.Name == provider.Provider.Name);
			database.SaveChanges();
			return Task.CompletedTask;
		}

		public Task<IEnumerable<string>> GetPossibleParameters()
		{
			return Task.FromResult<IEnumerable<string>>(null);
		}

		public int? Progress()
		{
			return null;
		}
	}
}