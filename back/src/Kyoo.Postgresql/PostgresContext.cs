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
using System.Globalization;
using System.Text.RegularExpressions;
using Dapper;
using EFCore.NamingConventions.Internal;
using InterpolatedSql.SqlBuilders;
using Kyoo.Abstractions.Models;
using Kyoo.Postgresql.Utils;
using Kyoo.Utils;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.EntityFrameworkCore.Query.SqlExpressions;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace Kyoo.Postgresql;

public class PostgresContext(DbContextOptions options, IHttpContextAccessor accessor)
	: DatabaseContext(options, accessor)
{
	protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
	{
		optionsBuilder.UseProjectables();
		optionsBuilder.UseSnakeCaseNamingConvention();
		base.OnConfiguring(optionsBuilder);
	}

	protected override void OnModelCreating(ModelBuilder modelBuilder)
	{
		modelBuilder.HasPostgresEnum<Status>();
		modelBuilder.HasPostgresEnum<Genre>();
		modelBuilder.HasPostgresEnum<WatchStatus>();

		modelBuilder
			.HasDbFunction(typeof(DatabaseContext).GetMethod(nameof(MD5))!)
			.HasTranslation(args => new SqlFunctionExpression(
				"md5",
				args,
				nullable: true,
				argumentsPropagateNullability: [false],
				type: args[0].Type,
				typeMapping: args[0].TypeMapping
			));

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
			typeof(Dictionary<string, EpisodeId>),
			new JsonTypeHandler<Dictionary<string, EpisodeId>>()
		);
		SqlMapper.AddTypeHandler(
			typeof(Dictionary<string, string>),
			new JsonTypeHandler<Dictionary<string, string>>()
		);
		SqlMapper.AddTypeHandler(
			typeof(Dictionary<string, ExternalToken>),
			new JsonTypeHandler<Dictionary<string, ExternalToken>>()
		);
		SqlMapper.AddTypeHandler(typeof(Image), new JsonTypeHandler<Image>());
		SqlMapper.AddTypeHandler(typeof(List<string>), new ListTypeHandler<string>());
		SqlMapper.AddTypeHandler(typeof(List<Genre>), new ListTypeHandler<Genre>());
		SqlMapper.AddTypeHandler(typeof(Wrapper), new Wrapper.Handler());
		InterpolatedSqlBuilderOptions.DefaultOptions.ReuseIdenticalParameters = true;
		InterpolatedSqlBuilderOptions.DefaultOptions.AutoFixSingleQuotes = false;

		base.OnModelCreating(modelBuilder);
	}

	/// <inheritdoc />
	protected override string LinkName<T, T2>()
	{
		SnakeCaseNameRewriter rewriter = new(CultureInfo.InvariantCulture);
		return rewriter.RewriteName("Link" + typeof(T).Name + typeof(T2).Name);
	}

	/// <inheritdoc />
	protected override string LinkNameFk<T>()
	{
		SnakeCaseNameRewriter rewriter = new(CultureInfo.InvariantCulture);
		return rewriter.RewriteName(typeof(T).Name + "ID");
	}

	/// <inheritdoc />
	protected override bool IsDuplicateException(Exception ex)
	{
		return ex.InnerException
			is PostgresException
			{
				SqlState: PostgresErrorCodes.UniqueViolation
					or PostgresErrorCodes.ForeignKeyViolation
			};
	}
}

public class PostgresContextBuilder : IDesignTimeDbContextFactory<PostgresContext>
{
	public PostgresContext CreateDbContext(string[] args)
	{
		IConfigurationRoot config = new ConfigurationBuilder()
			.AddEnvironmentVariables()
			.AddCommandLine(args)
			.Build();
		NpgsqlDataSource dataSource = PostgresModule.CreateDataSource(config);
		DbContextOptionsBuilder builder = new();
		builder.UseNpgsql(dataSource);

		return new PostgresContext(builder.Options, null!);
	}
}
