using System;
using System.Collections.Generic;
using Kyoo.Abstractions.Controllers;
using Kyoo.Database;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Kyoo.SqLite
{
	/// <summary>
	/// A module to add sqlite capacity to the app.
	/// </summary>
	public class SqLiteModule : IPlugin
	{
		/// <inheritdoc />
		public string Slug => "sqlite";

		/// <inheritdoc />
		public string Name => "SqLite";

		/// <inheritdoc />
		public string Description => "A database context for sqlite.";

		/// <inheritdoc />
		public Dictionary<string, Type> Configuration => new();

		/// <inheritdoc />
		public bool Enabled => _configuration.GetSelectedDatabase() == "sqlite";

		/// <summary>
		/// The configuration to use. The database connection string is pulled from it.
		/// </summary>
		private readonly IConfiguration _configuration;

		/// <summary>
		/// The host environment to check if the app is in debug mode.
		/// </summary>
		private readonly IWebHostEnvironment _environment;

		/// <summary>
		/// Create a new postgres module instance and use the given configuration and environment.
		/// </summary>
		/// <param name="configuration">The configuration to use</param>
		/// <param name="env">The environment that will be used (if the env is in development mode, more information will be displayed on errors.</param>
		public SqLiteModule(IConfiguration configuration, IWebHostEnvironment env)
		{
			_configuration = configuration;
			_environment = env;
		}

		/// <inheritdoc />
		public void Configure(IServiceCollection services)
		{
			services.AddDbContext<DatabaseContext, SqLiteContext>(x =>
			{
				x.UseSqlite(_configuration.GetDatabaseConnection("sqlite"));
				if (_environment.IsDevelopment())
					x.EnableDetailedErrors().EnableSensitiveDataLogging();
			}, ServiceLifetime.Transient);
		}

		/// <inheritdoc />
		public void Initialize(IServiceProvider provider)
		{
			DatabaseContext context = provider.GetRequiredService<DatabaseContext>();
			context.Database.Migrate();
		}
	}
}