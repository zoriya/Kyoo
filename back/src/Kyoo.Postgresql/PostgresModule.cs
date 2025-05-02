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
		var connectionString = configuration.GetValue<string>("POSTGRES_URL");

		// Load the connection string from the environment variable, as well as standard libpq environment variables
		// (PGUSER, PGPASSWORD, PGHOST, PGPORT, PGDATABASE, etc.)
		NpgsqlConnectionStringBuilder conBuilder = new(connectionString ?? "");
		// Set defaults when no explicit connection string is provided. This cannot be set if the connection string
		// is provided, or it will override connection string values.
		if (string.IsNullOrEmpty(connectionString))
		{
			conBuilder.Pooling = true;
			conBuilder.MaxPoolSize = 95;
			conBuilder.Timeout = 30;
		}

		string? oldVarUsername = configuration.GetValue<string>("POSTGRES_USER");
		if (!string.IsNullOrEmpty(oldVarUsername))
			conBuilder.Username = oldVarUsername;
		if (string.IsNullOrEmpty(conBuilder.Username))
			conBuilder.Username = "KyooUser";

		string? oldVarPassword = configuration.GetValue<string>("POSTGRES_PASSWORD");
		if (!string.IsNullOrEmpty(oldVarPassword))
			conBuilder.Password = oldVarPassword;
		if (string.IsNullOrEmpty(conBuilder.Password))
			conBuilder.Password = "KyooPassword";

		string? oldVarHost = configuration.GetValue<string>("POSTGRES_SERVER");
		if (!string.IsNullOrEmpty(oldVarHost))
			conBuilder.Host = oldVarHost;
		if (string.IsNullOrEmpty(conBuilder.Host))
			conBuilder.Host = "postgres";

		int? oldVarPort = configuration.GetValue<int>("POSTGRES_PORT");
		if (oldVarPort != null && oldVarPort != 0)
			conBuilder.Port = oldVarPort.Value;
		if (conBuilder.Port == 0)
			conBuilder.Port = 5432;

		string? oldVarDatabase = configuration.GetValue<string>("POSTGRES_DB");
		if (!string.IsNullOrEmpty(oldVarDatabase))
			conBuilder.Database = oldVarDatabase;
		if (string.IsNullOrEmpty(conBuilder.Database))
			conBuilder.Database = "kyooDB";

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
		builder.Configuration.AddDbConfigurationProvider(x => x.UseNpgsql(dataSource));
	}

	private static void AddDbConfigurationProvider(
		this IConfigurationBuilder builder,
		Action<DbContextOptionsBuilder> action
	)
	{
		builder.Add(new DbConfigurationSource(action));
	}
}
