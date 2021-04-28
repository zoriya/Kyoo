using System;
using Kyoo.Controllers;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Unity;
using Unity.Injection;
using Unity.Lifetime;
using Unity.Resolution;

namespace Kyoo.Postgresql
{
	/// <summary>
	/// A module to add postgresql capacity to the app.
	/// </summary>
	public class PostgresModule : IPlugin
	{
		/// <inheritdoc />
		public string Slug => "postgresql";

		/// <inheritdoc />
		public string Name => "Postgresql";

		/// <inheritdoc />
		public string Description => "A database context for postgresql.";

		/// <inheritdoc />
		public string[] Provides => new[]
		{
			$"{nameof(DatabaseContext)}:{nameof(PostgresContext)}"
		};

		/// <inheritdoc />
		public string[] Requires => Array.Empty<string>();

		/// <inheritdoc />
		public void Configure(IUnityContainer container, IConfiguration config, IApplicationBuilder app, bool debugMode)
		{
			// options.UseNpgsql(_configuration.GetDatabaseConnection());
			// //          				// .EnableSensitiveDataLogging()
			// //          				// .UseLoggerFactory(LoggerFactory.Create(builder => builder.AddConsole()));
			
			container.RegisterFactory<DatabaseContext>(_ =>
			{
				return new PostgresContext(config.GetDatabaseConnection(), debugMode);
			});
		}
	}
}