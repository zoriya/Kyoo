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
using Kyoo.Abstractions.Models;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Npgsql;

namespace Kyoo.Postgresql;

public static class PostgresModule
{
	public static NpgsqlDataSource CreateDataSource(IConfiguration configuration)
	{
		DbConnectionStringBuilder conBuilder =
			new()
			{
				["USER ID"] = configuration.GetValue("POSTGRES_USER", "KyooUser"),
				["PASSWORD"] = configuration.GetValue("POSTGRES_PASSWORD", "KyooPassword"),
				["SERVER"] = configuration.GetValue("POSTGRES_SERVER", "postgres"),
				["PORT"] = configuration.GetValue("POSTGRES_PORT", "5432"),
				["DATABASE"] = configuration.GetValue("POSTGRES_DB", "kyooDB"),
				["POOLING"] = "true",
				["MAXPOOLSIZE"] = "95",
				["TIMEOUT"] = "30"
			};

		NpgsqlDataSourceBuilder dsBuilder = new(conBuilder.ConnectionString);
		dsBuilder.MapEnum<Status>();
		dsBuilder.MapEnum<Genre>();
		dsBuilder.MapEnum<WatchStatus>();
		return dsBuilder.Build();
	}

	public static void ConfigurePostgres(this WebApplicationBuilder builder)
	{
		NpgsqlDataSource dataSource = CreateDataSource(builder.Configuration);
		builder.Services.AddDbContext<DatabaseContext, PostgresContext>(
			x =>
			{
				x.UseNpgsql(dataSource);
				if (builder.Environment.IsDevelopment())
					x.EnableDetailedErrors().EnableSensitiveDataLogging();
			},
			ServiceLifetime.Transient
		);
		builder.Services.AddTransient(
			(services) => services.GetRequiredService<DatabaseContext>().Database.GetDbConnection()
		);

		builder.Services.AddHealthChecks().AddDbContextCheck<DatabaseContext>();
	}
}
