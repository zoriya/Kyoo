﻿using System;
using System.Collections.Generic;
using Kyoo.Controllers;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Unity;

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
		public ICollection<Type> Provides => new[]
		{
			typeof(PostgresContext)
		};

		/// <inheritdoc />
		public ICollection<ConditionalProvide> ConditionalProvides => ArraySegment<ConditionalProvide>.Empty;

		/// <inheritdoc />
		public ICollection<Type> Requires => ArraySegment<Type>.Empty;


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
		public PostgresModule(IConfiguration configuration, IWebHostEnvironment env)
		{
			_configuration = configuration;
			_environment = env;
		}
		
		/// <inheritdoc />
		public void Configure(IUnityContainer container, ICollection<Type> availableTypes)
		{
			container.RegisterFactory<DatabaseContext>(_ => new PostgresContext(
				_configuration.GetDatabaseConnection("postgres"), 
				_environment.IsDevelopment()));
		}
	}
}