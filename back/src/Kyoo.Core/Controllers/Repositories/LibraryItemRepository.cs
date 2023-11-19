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
using System.IO;
using System.Linq;
using System.Linq.Expressions;
using System.Runtime.CompilerServices;
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
		public virtual async Task<ILibraryItem> Get(
			Expression<Func<ILibraryItem, bool>> where,
			Include<ILibraryItem>? include = default)
		{
			ILibraryItem? ret = await GetOrDefault(where, include: include);
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

		public Task<ILibraryItem?> GetOrDefault(Expression<Func<ILibraryItem, bool>> where, Include<ILibraryItem>? include = null, Sort<ILibraryItem>? sortBy = null)
		{
			throw new NotImplementedException();
		}

		public string ProcessSort<T>(Sort<T> sort, Dictionary<string, Type> config)
			where T : IQuery
		{
			string Property(string key)
			{
				if (config.Count == 1)
					return $"{config.First()}.{key.ToSnakeCase()}";

				IEnumerable<string> keys = config
					.Where(x => x.Value.GetProperty(key) != null)
					.Select(x => $"{x.Key}.{key.ToSnakeCase()}");
				return $"coalesce({string.Join(", ", keys)})";
			}

			string ret = sort switch
			{
				Sort<T>.Default(var value) => ProcessSort(value, config),
				Sort<T>.By(string key, bool desc) => $"{Property(key)} {(desc ? "desc nulls last" : "asc")}",
				Sort<T>.Random(var seed) => $"md5('{seed}' || {Property("id")})",
				Sort<T>.Conglomerate(var list) => string.Join(", ", list.Select(x => ProcessSort(x, config))),
				_ => throw new SwitchExpressionException(),
			};
			// always end query by an id sort.
			return $"{ret}, {Property("id")} asc";
		}

		public async Task<ICollection<ILibraryItem>> GetAll(
			Expression<Func<ILibraryItem, bool>>? where = null,
			Sort<ILibraryItem>? sort = null,
			Pagination? limit = null,
			Include<ILibraryItem>? include = null)
		{
			Dictionary<string, Type> config = new()
			{
				{ "s", typeof(Show) },
				{ "m", typeof(Movie) },
				{ "c", typeof(Collection) }
			};
			// language=PostgreSQL
			IDapperSqlCommand query = _database.SqlBuilder($"""
				select
					s.*,
					m.*,
					c.*,
					st.*
				from
					shows as s
					full outer join (
					select
						*
					from
						movies) as m on false
					full outer join (
						select
							*
						from
							collections) as c on false
					left join studios as st on st.id = coalesce(s.studio_id, m.studio_id)
				order by {ProcessSort(sort, config):raw}
				limit {limit.Limit}
			""").Build();

			Type[] types = config.Select(x => x.Value).Concat(new[] { typeof(Studio) }).ToArray();
			IEnumerable<ILibraryItem> data = await query.QueryAsync<ILibraryItem>(types, items =>
			{
				var studio = items[3] as Studio;
				if (items[0] is Show show && show.Id != 0)
					return show;
				if (items[1] is Movie movie && movie.Id != 0)
					return movie;
				if (items[2] is Collection collection && collection.Id != 0)
					return collection;
				throw new InvalidDataException();
			});
			return data.ToList();
		}

		public Task<int> GetCount(Expression<Func<ILibraryItem, bool>>? where = null)
		{
			throw new NotImplementedException();
		}

		public Task<ICollection<ILibraryItem>> FromIds(IList<int> ids, Include<ILibraryItem>? include = null)
		{
			throw new NotImplementedException();
		}

		public Task DeleteAll(Expression<Func<ILibraryItem, bool>> where)
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
