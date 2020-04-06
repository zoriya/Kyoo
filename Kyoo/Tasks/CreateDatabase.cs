using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using IdentityServer4.EntityFramework.DbContexts;
using IdentityServer4.EntityFramework.Mappers;
using IdentityServer4.Models;
using Kyoo.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Kyoo.Tasks
{
	public class CreateDatabase : ITask
	{
		public string Slug => "create-database";
		public string Name => "Create the database";
		public string Description => "Create the database if it does not exit and initialize it with defaults value.";
		public string HelpMessage => null;
		public bool RunOnStartup => true;
		public int Priority => Int32.MaxValue;
		
		public Task Run(IServiceProvider serviceProvider, CancellationToken cancellationToken)
		{
			using IServiceScope serviceScope = serviceProvider.CreateScope();
			DatabaseContext databaseContext = serviceScope.ServiceProvider.GetService<DatabaseContext>();
			ConfigurationDbContext identityContext = serviceScope.ServiceProvider.GetService<ConfigurationDbContext>();
			
			databaseContext.Database.Migrate();
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
			return Task.CompletedTask;
		}
	}
}