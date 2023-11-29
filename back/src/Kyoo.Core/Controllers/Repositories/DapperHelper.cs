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
using System.ComponentModel.DataAnnotations.Schema;
using System.Data;
using System.Linq;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Dapper;
using InterpolatedSql.Dapper;
using InterpolatedSql.Dapper.SqlBuilders;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Abstractions.Models.Utils;
using Kyoo.Authentication;
using Kyoo.Utils;
using Microsoft.AspNetCore.Http;

namespace Kyoo.Core.Controllers;

public static class DapperHelper
{
	public static SqlBuilder ProcessVariables(SqlBuilder sql, SqlVariableContext context)
	{
		int start = 0;
		while ((start = sql.IndexOf("[", start, false)) != -1)
		{
			int end = sql.IndexOf("]", start, false);
			if (end == -1)
				throw new ArgumentException("Invalid sql variable substitue (missing ])");
			string var = sql.Format[(start + 1)..end];
			sql.Remove(start, end - start + 1);
			sql.Insert(start, $"{context.ReadVar(var)}");
		}

		return sql;
	}

	public static string Property(string key, Dictionary<string, Type> config)
	{
		if (key == "kind")
			return "kind";
		string[] keys = config
			.Where(x => key == "id" || x.Value.GetProperty(key) != null)
			.Select(x => $"{x.Key}.{x.Value.GetProperty(key)?.GetCustomAttribute<ColumnAttribute>()?.Name ?? key.ToSnakeCase()}")
			.ToArray();
		if (keys.Length == 1)
			return keys.First();
		return $"coalesce({string.Join(", ", keys)})";
	}

	public static string ProcessSort<T>(Sort<T> sort, bool reverse, Dictionary<string, Type> config, bool recurse = false)
		where T : IQuery
	{
		string ret = sort switch
		{
			Sort<T>.Default(var value) => ProcessSort(value, reverse, config, true),
			Sort<T>.By(string key, bool desc) => $"{Property(key, config)} {(desc ^ reverse ? "desc" : "asc")}",
			Sort<T>.Random(var seed) => $"md5('{seed}' || {Property("id", config)}) {(reverse ? "desc" : "asc")}",
			Sort<T>.Conglomerate(var list) => string.Join(", ", list.Select(x => ProcessSort(x, reverse, config, true))),
			_ => throw new SwitchExpressionException(),
		};
		if (recurse)
			return ret;
		// always end query by an id sort.
		return $"{ret}, {Property("id", config)} {(reverse ? "desc" : "asc")}";
	}

	public static (
		string projection,
		string join,
		List<Type> types,
		Func<T, IEnumerable<object?>, T> map
	) ProcessInclude<T>(Include<T> include, Dictionary<string, Type> config)
		where T : class
	{
		int relation = 0;
		List<Type> types = new();
		StringBuilder projection = new();
		StringBuilder join = new();

		foreach (Include.Metadata metadata in include.Metadatas)
		{
			relation++;
			switch (metadata)
			{
				case Include.SingleRelation(var name, var type, var rid):
					string tableName = type.GetCustomAttribute<TableAttribute>()?.Name ?? $"{type.Name.ToSnakeCase()}s";
					types.Add(type);
					projection.AppendLine($", r{relation}.* -- {type.Name} as r{relation}");
					join.Append($"\nleft join {tableName} as r{relation} on r{relation}.id = {Property(rid, config)}");
					break;
				case Include.CustomRelation(var name, var type, var sql, var on, var declaring):
					string owner = config.First(x => x.Value == declaring).Key;
					string lateral = sql.Contains("\"this\"") ? " lateral" : string.Empty;
					sql = sql.Replace("\"this\"", owner);
					on = on?.Replace("\"this\"", owner)?.Replace("\"relation\"", $"r{relation}");
					if (sql.Any(char.IsWhiteSpace))
						sql = $"({sql})";
					types.Add(type);
					projection.AppendLine($", r{relation}.*");
					join.Append($"\nleft join{lateral} {sql} as r{relation} on r{relation}.{on}");
					break;
				case Include.ProjectedRelation:
					continue;
				default:
					throw new NotImplementedException();
			}
		}

		T Map(T item, IEnumerable<object?> relations)
		{
			foreach ((string name, object? value) in include.Fields.Zip(relations))
			{
				if (value == null)
					continue;
				PropertyInfo? prop = item.GetType().GetProperty(name);
				if (prop != null)
					prop.SetValue(item, value);
			}
			return item;
		}

		return (projection.ToString(), join.ToString(), types, Map);
	}

	public static FormattableString ProcessFilter<T>(Filter<T> filter, Dictionary<string, Type> config)
	{
		FormattableString Format(string key, FormattableString op)
		{
			if (key == "kind")
			{
				string cases = string.Join('\n', config
					.Skip(1)
					.Select(x => $"when {x.Key}.id is not null then '{x.Value.Name.ToLowerInvariant()}'")
				);
				return $"""
					case
						{cases:raw}
						else '{config.First().Value.Name.ToLowerInvariant():raw}'
					end {op}
				""";
			}

			IEnumerable<string> properties = config
				.Where(x => key == "id" || x.Value.GetProperty(key) != null)
				.Select(x => $"{x.Key}.{x.Value.GetProperty(key)?.GetCustomAttribute<ColumnAttribute>()?.Name ?? key.ToSnakeCase()}");

			FormattableString ret = $"{properties.First():raw} {op}";
			foreach (string property in properties.Skip(1))
				ret = $"{ret} or {property:raw} {op}";
			return $"({ret})";
		}

		object P(object value)
		{
			if (value is Enum)
				return new Wrapper(value);
			return value;
		}

		FormattableString Process(Filter<T> fil)
		{
			return fil switch
			{
				Filter<T>.And(var first, var second) => $"({Process(first)} and {Process(second)})",
				Filter<T>.Or(var first, var second) => $"({Process(first)} or {Process(second)})",
				Filter<T>.Not(var inner) => $"(not {Process(inner)})",
				Filter<T>.Eq(var property, var value) when value is null => Format(property, $"is null"),
				Filter<T>.Ne(var property, var value) when value is null => Format(property, $"is not null"),
				Filter<T>.Eq(var property, var value) => Format(property, $"= {P(value!)}"),
				Filter<T>.Ne(var property, var value) => Format(property, $"!= {P(value!)}"),
				Filter<T>.Gt(var property, var value) => Format(property, $"> {P(value)}"),
				Filter<T>.Ge(var property, var value) => Format(property, $">= {P(value)}"),
				Filter<T>.Lt(var property, var value) => Format(property, $"< {P(value)}"),
				Filter<T>.Le(var property, var value) => Format(property, $"> {P(value)}"),
				Filter<T>.Has(var property, var value) => $"{P(value)} = any({Property(property, config):raw})",
				Filter<T>.CmpRandom(var op, var seed, var id) => $"md5({seed} || coalesce({string.Join(", ", config.Select(x => $"{x.Key}.id")):raw})) {op:raw} md5({seed} || {id.ToString()})",
				Filter<T>.Lambda(var lambda) => throw new NotSupportedException(),
				_ => throw new NotImplementedException(),
			};
		}
		return $"\nwhere {Process(filter)}";
	}

	public static string ExpendProjections(string type, string? prefix, Include include)
	{
		IEnumerable<string> projections = include.Metadatas
			.Select(x => x is Include.ProjectedRelation(var name, var sql) ? sql : null!)
			.Where(x => x != null)
			.Select(x => x.Replace("\"this\".", prefix));
		return string.Join(string.Empty, projections.Select(x => $", {x}"));
	}

	public static async Task<ICollection<T>> Query<T>(
		this IDbConnection db,
		FormattableString command,
		Dictionary<string, Type> config,
		Func<List<object?>, T> mapper,
		Func<Guid, Task<T>> get,
		SqlVariableContext context,
		Include<T>? include,
		Filter<T>? filter,
		Sort<T>? sort,
		Pagination? limit)
		where T : class, IResource, IQuery
	{
		SqlBuilder query = new(db, command);

		// Include handling
		include ??= new();
		var (includeProjection, includeJoin, includeTypes, mapIncludes) = ProcessInclude(include, config);
		query.AppendLiteral(includeJoin);
		query.Replace("/* includes */", $"{includeProjection:raw}", out bool replaced);
		if (!replaced)
			throw new ArgumentException("Missing '/* includes */' placeholder in top level sql select to support includes.");

		// Handle pagination, orders and filter.
		if (limit?.AfterID != null)
		{
			T reference = await get(limit.AfterID.Value);
			Filter<T>? keysetFilter = RepositoryHelper.KeysetPaginate(sort, reference, !limit.Reverse);
			filter = Filter.And(filter, keysetFilter);
		}
		if (filter != null)
			query += ProcessFilter(filter, config);
		if (sort != null)
			query += $"\norder by {ProcessSort(sort, limit?.Reverse ?? false, config):raw}";
		if (limit != null)
			query += $"\nlimit {limit.Limit}";

		ProcessVariables(query, context);

		// Build query and prepare to do the query/projections
		IDapperSqlCommand cmd = query.Build();
		string sql = cmd.Sql;
		List<Type> types = config.Select(x => x.Value).Concat(includeTypes).ToList();

		// Expand projections on every types received.
		sql = Regex.Replace(sql, @"(,?) -- (\w+)( as (\w+))?", (match) =>
		{
			string leadingComa = match.Groups[1].Value;
			string type = match.Groups[2].Value;
			string? prefix = match.Groups[4].Value;
			prefix = !string.IsNullOrEmpty(prefix) ? $"{prefix}." : string.Empty;

			// Only project top level items with explicit includes.
			string? projection = config.Any(x => x.Value.Name == type)
				? ExpendProjections(type, prefix, include)
				: null;
			Type? typeV = types.FirstOrDefault(x => x.Name == type);
			if (typeV?.IsAssignableTo(typeof(IThumbnails)) == true)
			{
				string posterProj = string.Join(", ", new[] { "poster", "thumbnail", "logo" }
					.Select(x => $"{prefix}{x}_source as source, {prefix}{x}_blurhash as blurhash"));
				projection = string.IsNullOrEmpty(projection)
					? posterProj
					: $"{posterProj}, {projection}";
				types.InsertRange(types.IndexOf(typeV) + 1, Enumerable.Repeat(typeof(Image), 3));
			}

			if (string.IsNullOrEmpty(projection))
				return leadingComa;
			return $", {projection}{leadingComa}";
		});

		IEnumerable<T> data = await db.QueryAsync<T>(
			sql,
			types.ToArray(),
			items =>
			{
				List<object?> nItems = new(items.Length);
				for (int i = 0; i < items.Length; i++)
				{
					if (types[i] == typeof(Image))
						continue;
					nItems.Add(items[i]);
					if (items[i] is not IThumbnails thumbs)
						continue;
					thumbs.Poster = items[++i] as Image;
					thumbs.Thumbnail = items[++i] as Image;
					thumbs.Logo = items[++i] as Image;
				}
				return mapIncludes(mapper(nItems), nItems.Skip(config.Count));
			},
			ParametersDictionary.LoadFrom(cmd),
			splitOn: string.Join(',', types.Select(x => x.GetCustomAttribute<SqlFirstColumnAttribute>()?.Name ?? "id"))
		);
		if (limit?.Reverse == true)
			data = data.Reverse();
		return data.ToList();
	}

	public static async Task<T?> QuerySingle<T>(
		this IDbConnection db,
		FormattableString command,
		Dictionary<string, Type> config,
		Func<List<object?>, T> mapper,
		SqlVariableContext context,
		Include<T>? include,
		Filter<T>? filter,
		Sort<T>? sort = null,
		bool reverse = false)
		where T : class, IResource, IQuery
	{
		ICollection<T> ret = await db.Query<T>(
			command,
			config,
			mapper,
			get: null!,
			context,
			include,
			filter,
			sort,
			new Pagination(1, reverse: reverse)
		);
		return ret.FirstOrDefault();
	}

	public static async Task<int> Count<T>(
		this IDbConnection db,
		FormattableString command,
		Dictionary<string, Type> config,
		SqlVariableContext context,
		Filter<T>? filter)
		where T : class, IResource
	{
		InterpolatedSql.Dapper.SqlBuilders.SqlBuilder query = new(db, command);

		if (filter != null)
			query += ProcessFilter(filter, config);
		ProcessVariables(query, context);
		IDapperSqlCommand cmd = query.Build();

		// language=postgreSQL
		string sql = $"select count(*) from ({cmd.Sql}) as query";

		return await db.QuerySingleAsync<int>(
			sql,
			ParametersDictionary.LoadFrom(cmd)
		);
	}
}

public class SqlVariableContext
{
	private readonly IHttpContextAccessor _accessor;

	public SqlVariableContext(IHttpContextAccessor accessor)
	{
		_accessor = accessor;
	}

	public object? ReadVar(string var)
	{
		return var switch
		{
			"current_user" => _accessor.HttpContext?.User.GetId(),
			_ => throw new ArgumentException($"Invalid sql variable name: {var}")
		};
	}
}
