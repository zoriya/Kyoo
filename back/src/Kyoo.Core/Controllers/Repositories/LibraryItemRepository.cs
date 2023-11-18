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
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Exceptions;
using Kyoo.Abstractions.Models.Utils;

namespace Kyoo.Core.Controllers
{
	/// <summary>
	/// A local repository to handle library items.
	/// </summary>
	public class LibraryItemRepository : IRepository<LibraryItem>
	{
		private readonly DbConnection _database;

		protected Sort<LibraryItem> DefaultSort => new Sort<LibraryItem>.By(x => x.Name);

		public Type RepositoryType => typeof(LibraryItem);

		public LibraryItemRepository(DbConnection database)
		{
			_database = database;
		}

		/// <inheritdoc/>
		public virtual async Task<LibraryItem> Get(int id, Include<LibraryItem>? include = default)
		{
			LibraryItem? ret = await GetOrDefault(id, include);
			if (ret == null)
				throw new ItemNotFoundException($"No {nameof(LibraryItem)} found with the id {id}");
			return ret;
		}

		/// <inheritdoc/>
		public virtual async Task<LibraryItem> Get(string slug, Include<LibraryItem>? include = default)
		{
			LibraryItem? ret = await GetOrDefault(slug, include);
			if (ret == null)
				throw new ItemNotFoundException($"No {nameof(LibraryItem)} found with the slug {slug}");
			return ret;
		}

		/// <inheritdoc/>
		public virtual async Task<LibraryItem> Get(
			Expression<Func<LibraryItem, bool>> where,
			Include<LibraryItem>? include = default)
		{
			LibraryItem? ret = await GetOrDefault(where, include: include);
			if (ret == null)
				throw new ItemNotFoundException($"No {nameof(LibraryItem)} found with the given predicate.");
			return ret;
		}

		public Task<LibraryItem?> GetOrDefault(int id, Include<LibraryItem>? include = null)
		{
			throw new NotImplementedException();
		}

		public Task<LibraryItem?> GetOrDefault(string slug, Include<LibraryItem>? include = null)
		{
			throw new NotImplementedException();
		}

		public Task<LibraryItem?> GetOrDefault(Expression<Func<LibraryItem, bool>> where, Include<LibraryItem>? include = null, Sort<LibraryItem>? sortBy = null)
		{
			throw new NotImplementedException();
		}

		public string ProcessSort<T>(Sort<T> sort, string[] tables)
		{
			return sort switch
			{
				// TODO: Implement default sort by
				Sort<T>.Default => "",
				Sort<T>.By(string key, bool desc) => $"coalesce({tables.Select(x => $"{x}.{key}")}) {(desc ? "desc" : "asc")}",
				Sort<T>.Random(var seed) => $"md5({seed} || coalesce({tables.Select(x => $"{x}.id")}))",
				Sort<T>.Conglomerate(var list) => string.Join(", ", list.Select(x => ProcessSort(x, tables))),
				_ => throw new SwitchExpressionException(),
			};
		}

		public async Task<ICollection<LibraryItem>> GetAll(
			Expression<Func<LibraryItem, bool>>? where = null,
			Sort<LibraryItem>? sort = null,
			Pagination? limit = null,
			Include<LibraryItem>? include = null)
		{
			// language=PostgreSQL
			string sql = @"
				select s.*, m.*, c.*, st.* from shows as s full outer join (
					select * from movies
				) as m on false
				full outer join (
					select * from collections
				) as c on false
				left join studios as st on st.id = coalesce(s.studio_id, m.studio_id)
				order by @SortBy
				limit @Take
			";

			var data = await _database.QueryAsync<IResource>(sql, new[] { typeof(Show), typeof(Movie), typeof(Collection), typeof(Studio) }, items =>
			{
				var studio = items[3] as Studio;
				if (items[0] is Show show && show.Id != 0)
					return show;
				if (items[1] is Movie movie && movie.Id != 0)
					return movie;
				if (items[2] is Collection collection && collection.Id != 0)
					return collection;
				throw new InvalidDataException();
			}, new { SortBy = ProcessSort(sort, new[] { "s", "m", "c" }), Take = limit.Limit });

			// await using DbDataReader reader = await _database.ExecuteReaderAsync(sql);
			// int kindOrdinal = reader.GetOrdinal("kind");
			// var showParser = reader.GetRowParser<IResource>(typeof(Show));
			// var movieParser = reader.GetRowParser<IResource>(typeof(Movie));
			// var collectionParser = reader.GetRowParser<IResource>(typeof(Collection));
			//
			// while (await reader.ReadAsync())
			// {
			// 	ItemKind type = await reader.GetFieldValueAsync<ItemKind>(kindOrdinal);
			// 	ret.Add(type switch
			// 	{
			// 		ItemKind.Show => showParser(reader),
			// 		ItemKind.Movie => movieParser(reader),
			// 		ItemKind.Collection => collectionParser(reader),
			// 		_ => throw new InvalidDataException(),
			// 	});
			// }
			throw new NotImplementedException();
			// return ret;
		}

		public Task<int> GetCount(Expression<Func<LibraryItem, bool>>? where = null)
		{
			throw new NotImplementedException();
		}

		public Task<ICollection<LibraryItem>> FromIds(IList<int> ids, Include<LibraryItem>? include = null)
		{
			throw new NotImplementedException();
		}

		public Task DeleteAll(Expression<Func<LibraryItem, bool>> where)
		{
			throw new NotImplementedException();
		}
		/// <inheritdoc />
		public async Task<ICollection<LibraryItem>> Search(string query, Include<LibraryItem>? include = default)
		{
			throw new NotImplementedException();
			// return await Sort(
			// 		AddIncludes(_database.LibraryItems, include)
			// 			.Where(_database.Like<LibraryItem>(x => x.Name, $"%{query}%"))
			// 	)
			// 	.Take(20)
			// 	.ToListAsync();
		}

		public async Task<ICollection<LibraryItem>> GetAllOfCollection(
			Expression<Func<Collection, bool>> selector,
			Expression<Func<LibraryItem, bool>>? where = null,
			Sort<LibraryItem>? sort = default,
			Pagination? limit = default,
			Include<LibraryItem>? include = default)
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
		public Task<LibraryItem> Create(LibraryItem obj)
			=> throw new InvalidOperationException();

		/// <inheritdoc />
		public Task<LibraryItem> CreateIfNotExists(LibraryItem obj)
			=> throw new InvalidOperationException();

		/// <inheritdoc />
		public Task<LibraryItem> Edit(LibraryItem edited)
			=> throw new InvalidOperationException();

		/// <inheritdoc />
		public Task<LibraryItem> Patch(int id, Func<LibraryItem, Task<bool>> patch)
			=> throw new InvalidOperationException();

		/// <inheritdoc />
		public Task Delete(int id)
			=> throw new InvalidOperationException();

		/// <inheritdoc />
		public Task Delete(string slug)
			=> throw new InvalidOperationException();

		/// <inheritdoc />
		public Task Delete(LibraryItem obj)
			=> throw new InvalidOperationException();
	}
}
