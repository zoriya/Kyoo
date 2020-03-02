using System;
using System.Threading;
using System.Threading.Tasks;
using IdentityServer4.EntityFramework.DbContexts;
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
				serviceScope.ServiceProvider.GetService<DatabaseContext>().Database.EnsureCreated();
				serviceScope.ServiceProvider.GetService<ConfigurationDbContext>().Database.EnsureCreated();
				serviceScope.ServiceProvider.GetService<PersistedGrantDbContext>().Database.EnsureCreated();
				// Use the next line if the database is not SQLite (SQLite doesn't support complexe migrations).
				// serviceScope.ServiceProvider.GetService<DatabaseContext>().Database.Migrate();;
				
				IPluginManager pluginManager = serviceScope.ServiceProvider.GetService<IPluginManager>();
				pluginManager.ReloadPlugins();

				ICrawler crawler = serviceScope.ServiceProvider.GetService<ICrawler>();
				await crawler.StartAsync(stoppingToken);
			}
		}
	}
}