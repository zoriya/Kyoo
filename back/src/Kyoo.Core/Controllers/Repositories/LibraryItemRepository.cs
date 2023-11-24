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
using System.Data.Common;
using System.IO;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;
using Dapper;
using InterpolatedSql.Dapper;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Exceptions;
using Kyoo.Abstractions.Models.Utils;
using Kyoo.Utils;

namespace Kyoo.Core.Controllers
{
	/// <summary>
	/// A local repository to handle library items.
	/// </summary>
	public class LibraryItemRepository : IRepository<ILibraryItem>
	{
		private readonly DbConnection _database;

		public Type RepositoryType => typeof(ILibraryItem);

		public LibraryItemRepository(DbConnection database)
		{
			_database = database;
		}

		/// <inheritdoc/>
		public virtual async Task<ILibraryItem> Get(int id, Include<ILibraryItem>? include = default)
		{
			ILibraryItem? ret = await GetOrDefault(id, include);
			if (ret == null)
				throw new ItemNotFoundException($"No {nameof(ILibraryItem)} found with the id {id}");
			return ret;
		}

		/// <inheritdoc/>
		public virtual async Task<ILibraryItem> Get(string slug, Include<ILibraryItem>? include = default)
		{
			ILibraryItem? ret = await GetOrDefault(slug, include);
			if (ret == null)
				throw new ItemNotFoundException($"No {nameof(ILibraryItem)} found with the slug {slug}");
			return ret;
		}

		/// <inheritdoc/>
		public virtual async Task<ILibraryItem> Get(Filter<ILibraryItem> filter,
			Include<ILibraryItem>? include = default)
		{
			ILibraryItem? ret = await GetOrDefault(filter, include: include);
			if (ret == null)
				throw new ItemNotFoundException($"No {nameof(ILibraryItem)} found with the given predicate.");
			return ret;
		}

		public Task<ILibraryItem?> GetOrDefault(int id, Include<ILibraryItem>? include = null)
		{
			throw new NotImplementedException();
		}

		public Task<ILibraryItem?> GetOrDefault(string slug, Include<ILibraryItem>? include = null)
		{
			throw new NotImplementedException();
		}

		public Task<ILibraryItem?> GetOrDefault(Filter<ILibraryItem>? filter, Include<ILibraryItem>? include = default,
			Sort<ILibraryItem>? sortBy = default)
		{
			throw new NotImplementedException();
		}

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
						join.AppendLine($"left join {tableName} as r{relation} on r{relation}.id = {_Property(rid, config)}");
						break;
					case Include.CustomRelation(var name, var type, var sql, var on, var declaring):
						string owner = config.First(x => x.Value == declaring).Key;
						string lateral = sql.Contains("\"this\"") ? " lateral" : string.Empty;
						sql = sql.Replace("\"this\"", owner);
						on = on?.Replace("\"this\"", owner);
						retConfig.Add($"r{relation}", type);
						join.AppendLine($"left join{lateral} ({sql}) as r{relation} on r{relation}.{on}");
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

		public static FormattableString ExpendProjections<T>(string? prefix, Include include)
		{
			prefix = prefix != null ? $"{prefix}." : string.Empty;
			IEnumerable<string> projections = include.Metadatas
				.Select(x => x is Include.ProjectedRelation(var name, var sql) ? sql : null!)
				.Where(x => x != null)
				.Select(x => x.Replace("\"this\".", prefix));
			string projStr = string.Join(string.Empty, projections.Select(x => $", {x}"));
			return $"{prefix:raw}*{projStr:raw}";
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
			return $"where {Process(filter)}";
		}

		public async Task<ICollection<ILibraryItem>> GetAll(Filter<ILibraryItem>? filter = null,
			Sort<ILibraryItem>? sort = default,
			Include<ILibraryItem>? include = default,
			Pagination limit = default)
		{
			include ??= new();

			Dictionary<string, Type> config = new()
			{
				{ "s", typeof(Show) },
				{ "m", typeof(Movie) },
				{ "c", typeof(Collection) }
			};
			var (includeConfig, includeJoin, mapIncludes) = ProcessInclude(include, config);

			// language=PostgreSQL
			var query = _database.SqlBuilder($"""
				select
					{ExpendProjections<Show>("s", include)},
					m.*,
					c.*
					{string.Join(string.Empty, includeConfig.Select(x => $", {x.Key}.*")):raw}
				from
					shows as s
					full outer join (
					select
						{ExpendProjections<Movie>(null, include)}
					from
						movies) as m on false
						full outer join (
						select
							{ExpendProjections<Collection>(null, include)}
						from
							collections) as c on false
				{includeJoin:raw}
			""");

			if (limit.AfterID != null)
			{
				ILibraryItem reference = await Get(limit.AfterID.Value);
				Filter<ILibraryItem>? keysetFilter = RepositoryHelper.KeysetPaginate(sort, reference, !limit.Reverse);
				filter = Filter.And(filter, keysetFilter);
			}
			if (filter != null)
				query += ProcessFilter(filter, config);
			query += $"order by {ProcessSort(sort, limit.Reverse, config):raw}";
			query += $"limit {limit.Limit}";

			Type[] types = config.Select(x => x.Value)
				.Concat(includeConfig.Select(x => x.Value))
				.ToArray();
			IEnumerable<ILibraryItem> data = await query.QueryAsync<ILibraryItem>(types, items =>
			{
				if (items[0] is Show show && show.Id != 0)
					return mapIncludes(show, items.Skip(3));
				if (items[1] is Movie movie && movie.Id != 0)
					return mapIncludes(movie, items.Skip(3));
				if (items[2] is Collection collection && collection.Id != 0)
					return mapIncludes(collection, items.Skip(3));
				throw new InvalidDataException();
			});
			if (limit.Reverse)
				data = data.Reverse();
			return data.ToList();
		}

		public Task<int> GetCount(Filter<ILibraryItem>? filter = null)
		{
			throw new NotImplementedException();
		}

		public Task<ICollection<ILibraryItem>> FromIds(IList<int> ids, Include<ILibraryItem>? include = null)
		{
			throw new NotImplementedException();
		}

		public Task DeleteAll(Filter<ILibraryItem> filter)
		{
			throw new NotImplementedException();
		}

		/// <inheritdoc />
		public async Task<ICollection<ILibraryItem>> Search(string query, Include<ILibraryItem>? include = default)
		{
			throw new NotImplementedException();
			// return await Sort(
			// 		AddIncludes(_database.LibraryItems, include)
			// 			.Where(_database.Like<LibraryItem>(x => x.Name, $"%{query}%"))
			// 	)
			// 	.Take(20)
			// 	.ToListAsync();
		}

		public async Task<ICollection<ILibraryItem>> GetAllOfCollection(
			Expression<Func<Collection, bool>> selector,
			Expression<Func<ILibraryItem, bool>>? where = null,
			Sort<ILibraryItem>? sort = default,
			Pagination? limit = default,
			Include<ILibraryItem>? include = default)
		{
			throw new NotImplementedException();
			// return await ApplyFilters(
			// 	_database.LibraryItems
			// 		.Where(item =>
			// 			_database.Movies
			// 				.Where(x => x.Id == -item.Id)
			// 				.Any(x => x.Collections!.AsQueryable().Any(selector))
			// 			|| _database.Shows
			// 				.Where(x => x.Id == item.Id)
			// 				.Any(x => x.Collections!.AsQueryable().Any(selector))
			// 		),
			// 	where,
			// 	sort,
			// 	limit,
			// 	include);
		}

		/// <inheritdoc />
		public Task<ILibraryItem> Create(ILibraryItem obj)
			=> throw new InvalidOperationException();

		/// <inheritdoc />
		public Task<ILibraryItem> CreateIfNotExists(ILibraryItem obj)
			=> throw new InvalidOperationException();

		/// <inheritdoc />
		public Task<ILibraryItem> Edit(ILibraryItem edited)
			=> throw new InvalidOperationException();

		/// <inheritdoc />
		public Task<ILibraryItem> Patch(int id, Func<ILibraryItem, Task<bool>> patch)
			=> throw new InvalidOperationException();

		/// <inheritdoc />
		public Task Delete(int id)
			=> throw new InvalidOperationException();

		/// <inheritdoc />
		public Task Delete(string slug)
			=> throw new InvalidOperationException();

		/// <inheritdoc />
		public Task Delete(ILibraryItem obj)
			=> throw new InvalidOperationException();
	}
}
