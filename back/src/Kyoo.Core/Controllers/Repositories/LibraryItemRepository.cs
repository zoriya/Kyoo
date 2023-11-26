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

		public Task<ICollection<ILibraryItem>> GetAll(
			Filter<ILibraryItem>? filter = null,
			Sort<ILibraryItem>? sort = default,
			Include<ILibraryItem>? include = default,
			Pagination? limit = default)
		{
			// language=PostgreSQL
			FormattableString sql = $"""
				select
					s.*, -- Show as s
					m.*,
					c.*
					/* includes */
				from
					shows as s
					full outer join (
					select
						* -- Movie
					from
						movies) as m on false
					full outer join (
						select
							* -- Collection
						from
							collections) as c on false
			""";

			return _database.Query<ILibraryItem>(sql, new()
				{
					{ "s", typeof(Show) },
					{ "m", typeof(Movie) },
					{ "c", typeof(Collection) }
				},
				items =>
				{
					if (items[0] is Show show && show.Id != 0)
						return show;
					if (items[1] is Movie movie && movie.Id != 0)
						return movie;
					if (items[2] is Collection collection && collection.Id != 0)
						return collection;
					throw new InvalidDataException();
				},
				(id) => Get(id),
				include, filter, sort, limit ?? new()
			);
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
