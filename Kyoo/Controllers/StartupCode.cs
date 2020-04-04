using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using IdentityServer4.EntityFramework.DbContexts;
using IdentityServer4.EntityFramework.Mappers;
using IdentityServer4.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Kyoo.Controllers
{
	public class StartupCode : BackgroundService
	{
		private readonly IServiceProvider _serviceProvider;

		public StartupCode(IServiceProvider serviceProvider)
		{
			_serviceProvider = serviceProvider;
		}

		protected override async Task ExecuteAsync(CancellationToken stoppingToken)
		{
			using (IServiceScope serviceScope = _serviceProvider.CreateScope())
			{
				serviceScope.ServiceProvider.GetService<DatabaseContext>().Database.Migrate();
				
				ConfigurationDbContext identityContext = serviceScope.ServiceProvider.GetService<ConfigurationDbContext>();
				identityContext.Database.Migrate();
				if (!identityContext.Clients.Any())
				{
					foreach (Client client in IdentityContext.GetClients())
						identityContext.Clients.Add(client.ToEntity());
					identityContext.SaveChanges();
				}
				if (!identityContext.IdentityResources.Any())
				{
					foreach (IdentityResource resource in IdentityContext.GetIdentityResources())
						identityContext.IdentityResources.Add(resource.ToEntity());
					identityContext.SaveChanges();
				}
				if (!identityContext.ApiResources.Any())
				{
					foreach (ApiResource resource in IdentityContext.GetApis())
						identityContext.ApiResources.Add(resource.ToEntity());
					identityContext.SaveChanges();
				}

				IPluginManager pluginManager = serviceScope.ServiceProvider.GetService<IPluginManager>();
				pluginManager.ReloadPlugins();

				ICrawler crawler = serviceScope.ServiceProvider.GetService<ICrawler>();
				await crawler.StartAsync(stoppingToken);
			}
		}
	}
}