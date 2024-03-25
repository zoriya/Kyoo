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
using System.Collections.Generic;
using System.Data.Common;
using System.Text.RegularExpressions;
using Dapper;
using InterpolatedSql.SqlBuilders;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Postgresql.Utils;
using Kyoo.Utils;
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

	static PostgresModule()
	{
		SqlMapper.TypeMapProvider = (type) =>
		{
			return new CustomPropertyTypeMap(
				type,
				(type, name) =>
				{
					string newName = Regex.Replace(
						name,
						"(^|_)([a-z])",
						(match) => match.Groups[2].Value.ToUpperInvariant()
					);
					// TODO: Add images handling here (name: poster_source, newName: PosterSource) should set Poster.Source
					return type.GetProperty(newName)!;
				}
			);
		};
		SqlMapper.AddTypeHandler(
			typeof(Dictionary<string, MetadataId>),
			new JsonTypeHandler<Dictionary<string, MetadataId>>()
		);
		SqlMapper.AddTypeHandler(
			typeof(Dictionary<string, string>),
			new JsonTypeHandler<Dictionary<string, string>>()
		);
		SqlMapper.AddTypeHandler(
			typeof(Dictionary<string, ExternalToken>),
			new JsonTypeHandler<Dictionary<string, ExternalToken>>()
		);
		SqlMapper.AddTypeHandler(typeof(List<string>), new ListTypeHandler<string>());
		SqlMapper.AddTypeHandler(typeof(List<Genre>), new ListTypeHandler<Genre>());
		SqlMapper.AddTypeHandler(typeof(Wrapper), new Wrapper.Handler());
		InterpolatedSqlBuilderOptions.DefaultOptions.ReuseIdenticalParameters = true;
		InterpolatedSqlBuilderOptions.DefaultOptions.AutoFixSingleQuotes = false;
	}

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

		services.AddDbContext<DatabaseContext, PostgresContext>(
			x =>
			{
				x.UseNpgsql(builder.ConnectionString).UseProjectables();
				if (environment.IsDevelopment())
					x.EnableDetailedErrors().EnableSensitiveDataLogging();
			},
			ServiceLifetime.Transient
		);
		services.AddTransient<DbConnection>((_) => new NpgsqlConnection(builder.ConnectionString));

		services.AddHealthChecks().AddDbContextCheck<DatabaseContext>();
	}
}
