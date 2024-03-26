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

using System.Data.Common;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Npgsql;

namespace Kyoo.Postgresql;

/// <summary>
/// A module to add postgresql capacity to the app.
/// </summary>
public class PostgresModule(IConfiguration configuration, IWebHostEnvironment environment) : IPlugin
{
	/// <inheritdoc />
	public string Name => "Postgresql";

	/// <inheritdoc />
	public void Configure(IServiceCollection services)
	{
		DbConnectionStringBuilder builder =
			new()
			{
				["USER ID"] = configuration.GetValue("POSTGRES_USER", "KyooUser"),
				["PASSWORD"] = configuration.GetValue("POSTGRES_PASSWORD", "KyooPassword"),
				["SERVER"] = configuration.GetValue("POSTGRES_SERVER", "db"),
				["PORT"] = configuration.GetValue("POSTGRES_PORT", "5432"),
				["DATABASE"] = configuration.GetValue("POSTGRES_DB", "kyooDB"),
				["POOLING"] = "true",
				["MAXPOOLSIZE"] = "95",
				["TIMEOUT"] = "30"
			};

		NpgsqlDataSourceBuilder dsBuilder = new(builder.ConnectionString);
		dsBuilder.MapEnum<Status>();
		dsBuilder.MapEnum<Genre>();
		dsBuilder.MapEnum<WatchStatus>();
		NpgsqlDataSource dataSource = dsBuilder.Build();

		services.AddDbContext<DatabaseContext, PostgresContext>(
			x =>
			{
				x.UseNpgsql(dataSource).UseProjectables();
				if (environment.IsDevelopment())
					x.EnableDetailedErrors().EnableSensitiveDataLogging();
			},
			ServiceLifetime.Transient
		);
		services.AddTransient(
			(services) => services.GetRequiredService<DatabaseContext>().Database.GetDbConnection()
		);

		services.AddHealthChecks().AddDbContextCheck<DatabaseContext>();
	}
}
