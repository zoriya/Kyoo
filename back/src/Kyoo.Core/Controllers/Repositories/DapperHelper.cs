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
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Utils;
using Kyoo.Utils;

namespace Kyoo.Core.Controllers;

public static class DapperHelper
{
	private static string _Property(string key, Dictionary<string, Type> config)
	{
		if (config.Count == 1)
			return $"{config.First()}.{key.ToSnakeCase()}";

		IEnumerable<string> keys = config
			.Where(x => key == "id" || x.Value.GetProperty(key) != null)
			.Select(x => $"{x.Key}.{x.Value.GetProperty(key)?.GetCustomAttribute<ColumnAttribute>()?.Name ?? key.ToSnakeCase()}");
		return $"coalesce({string.Join(", ", keys)})";
	}

	public static string ProcessSort<T>(Sort<T>? sort, bool reverse, Dictionary<string, Type> config, bool recurse = false)
		where T : IQuery
	{
		sort ??= new Sort<T>.Default();

		string ret = sort switch
		{
			Sort<T>.Default(var value) => ProcessSort(value, reverse, config, true),
			Sort<T>.By(string key, bool desc) => $"{_Property(key, config)} {(desc ^ reverse ? "desc" : "asc")}",
			Sort<T>.Random(var seed) => $"md5('{seed}' || {_Property("id", config)}) {(reverse ? "desc" : "asc")}",
			Sort<T>.Conglomerate(var list) => string.Join(", ", list.Select(x => ProcessSort(x, reverse, config, true))),
			_ => throw new SwitchExpressionException(),
		};
		if (recurse)
			return ret;
		// always end query by an id sort.
		return $"{ret}, {_Property("id", config)} {(reverse ? "desc" : "asc")}";
	}

	public static (
		Dictionary<string, Type> config,
		string join,
		Func<T, IEnumerable<object>, T> map
	) ProcessInclude<T>(Include<T> include, Dictionary<string, Type> config)
		where T : class
	{
		int relation = 0;
		Dictionary<string, Type> retConfig = new();
		StringBuilder join = new();

		foreach (Include<T>.Metadata metadata in include.Metadatas)
		{
			relation++;
			switch (metadata)
			{
				case Include.SingleRelation(var name, var type, var rid):
					string tableName = type.GetCustomAttribute<TableAttribute>()?.Name ?? $"{type.Name.ToSnakeCase()}s";
					retConfig.Add($"r{relation}", type);
					join.Append($"\nleft join {tableName} as r{relation} on r{relation}.id = {_Property(rid, config)}");
					break;
				case Include.CustomRelation(var name, var type, var sql, var on, var declaring):
					string owner = config.First(x => x.Value == declaring).Key;
					string lateral = sql.Contains("\"this\"") ? " lateral" : string.Empty;
					sql = sql.Replace("\"this\"", owner);
					on = on?.Replace("\"this\"", owner);
					retConfig.Add($"r{relation}", type);
					join.Append($"\nleft join{lateral} ({sql}) as r{relation} on r{relation}.{on}");
					break;
				case Include.ProjectedRelation:
					continue;
				default:
					throw new NotImplementedException();
			}
		}

		T Map(T item, IEnumerable<object> relations)
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

		return (retConfig, join.ToString(), Map);
	}

	public static FormattableString ProcessFilter<T>(Filter<T> filter, Dictionary<string, Type> config)
	{
		FormattableString Format(string key, FormattableString op)
		{
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
				Filter<T>.Has(var property, var value) => $"{P(value)} = any({_Property(property, config):raw})",
				Filter<T>.EqRandom(var seed, var id) => $"md5({seed} || {config.Select(x => $"{x.Key}.id"):raw}) = md5({seed} || {id.ToString()})",
				Filter<T>.Lambda(var lambda) => throw new NotSupportedException(),
				_ => throw new NotImplementedException(),
			};
		}
		return $"\nwhere {Process(filter)}";
	}

	public static string ExpendProjections(string type, string? prefix, Include include)
	{
		prefix = prefix != null ? $"{prefix}." : string.Empty;
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
		Func<object?[], T> mapper,
		Func<int, Task<T>> get,
		Include<T>? include,
		Filter<T>? filter,
		Sort<T>? sort,
		Pagination limit)
		where T : class, IResource, IQuery
	{
		InterpolatedSql.Dapper.SqlBuilders.SqlBuilder query = new(db, command);

		// Include handling
		include ??= new();
		var (includeConfig, includeJoin, mapIncludes) = ProcessInclude(include, config);
		query.AppendLiteral(includeJoin);
		string includeProjection = string.Join(string.Empty, includeConfig.Select(x => $", {x.Key}.*"));
		query.Replace("/* includes */", $"{includeProjection:raw}", out bool replaced);
		if (!replaced)
			throw new ArgumentException("Missing '/* includes */' placeholder in top level sql select to support includes.");

		// Handle pagination, orders and filter.
		if (limit.AfterID != null)
		{
			T reference = await get(limit.AfterID.Value);
			Filter<T>? keysetFilter = RepositoryHelper.KeysetPaginate(sort, reference, !limit.Reverse);
			filter = Filter.And(filter, keysetFilter);
		}
		if (filter != null)
			query += ProcessFilter(filter, config);
		query += $"\norder by {ProcessSort(sort, limit.Reverse, config):raw}";
		query += $"\nlimit {limit.Limit}";

		// Build query and prepare to do the query/projections
		IDapperSqlCommand cmd = query.Build();
		string sql = cmd.Sql;
		Type[] types = config.Select(x => x.Value)
			.Concat(includeConfig.Select(x => x.Value))
			.ToArray();

		// Expand projections on every types received.
		sql = Regex.Replace(sql, @"(,?) -- (\w+)( as (\w+))?", (match) =>
		{
			string leadingComa = match.Groups[1].Value;
			string type = match.Groups[2].Value;
			string? prefix = match.Groups[3].Value;

			// Only project top level items with explicit includes.
			string? projection = config.Any(x => x.Value.Name == type)
				? ExpendProjections(type, prefix, include)
				: null;
			if (string.IsNullOrEmpty(projection))
				return leadingComa;
			return $", {projection}{leadingComa}";
		});

		IEnumerable<T> data = await db.QueryAsync<T>(
			sql,
			types,
			items => mapIncludes(mapper(items), items.Skip(config.Count)),
			ParametersDictionary.LoadFrom(cmd)
		);
		if (limit.Reverse)
			data = data.Reverse();
		return data.ToList();
	}
}
