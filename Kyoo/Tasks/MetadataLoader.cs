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
		
		public async Task Run(IServiceProvider serviceProvider, CancellationToken cancellationToken, string arguments = null)
		{
			using IServiceScope serviceScope = serviceProvider.CreateScope();
			IProviderRepository providers = serviceScope.ServiceProvider.GetService<IProviderRepository>();
			IPluginManager pluginManager = serviceScope.ServiceProvider.GetService<IPluginManager>();
			
			foreach (IMetadataProvider provider in pluginManager.GetPlugins<IMetadataProvider>())
			{
				if (string.IsNullOrEmpty(provider.Provider.Slug))
					throw new ArgumentException($"Empty provider slug (name: {provider.Provider.Name}).");
				await providers.CreateIfNotExists(provider.Provider);
			}
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