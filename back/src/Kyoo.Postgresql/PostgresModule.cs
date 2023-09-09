// Kyoo - A portable and vast media library solution.
// Copyright (c) Kyoo.
//
// See AUTHORS.md and LICENSE file in the project root for full license information.
//
// Kyoo is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// any later version.
//
// Kyoo is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Kyoo. If not, see <https://www.gnu.org/licenses/>.

using System;
using System.Data.Common;
using Kyoo.Abstractions.Controllers;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Npgsql;

namespace Kyoo.Postgresql
{
	/// <summary>
	/// A module to add postgresql capacity to the app.
	/// </summary>
	public class PostgresModule : IPlugin
	{
		/// <inheritdoc />
		public string Name => "Postgresql";

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

		/// <summary>
		/// Migrate the database.
		/// </summary>
		/// <param name="provider">The service list to retrieve the database context</param>
		public static void Initialize(IServiceProvider provider)
		{
			DatabaseContext context = provider.GetRequiredService<DatabaseContext>();
			context.Database.Migrate();

			using NpgsqlConnection conn = (NpgsqlConnection)context.Database.GetDbConnection();
			conn.Open();
			conn.ReloadTypes();
		}

		/// <inheritdoc />
		public void Configure(IServiceCollection services)
		{
			services.AddDbContext<DatabaseContext, PostgresContext>(x =>
			{
				DbConnectionStringBuilder builder = new()
				{
					["USER ID"] = _configuration.GetValue("POSTGRES_USER", "KyooUser"),
					["PASSWORD"] = _configuration.GetValue("POSTGRES_PASSWORD", "KyooPassword"),
					["SERVER"] = _configuration.GetValue("POSTGRES_SERVER", "db"),
					["PORT"] = _configuration.GetValue("POSTGRES_PORT", "5432"),
					["DATABASE"] = _configuration.GetValue("POSTGRES_DB", "kyooDB"),
					["POOLING"] = "true",
					["MAXPOOLSIZE"] = "95",
					["TIMEOUT"] = "30"
				};
				x.UseNpgsql(builder.ConnectionString)
					.UseProjectables();
				if (_environment.IsDevelopment())
					x.EnableDetailedErrors().EnableSensitiveDataLogging();
			}, ServiceLifetime.Transient);

			services.AddHealthChecks().AddDbContextCheck<DatabaseContext>();
		}
	}
}
