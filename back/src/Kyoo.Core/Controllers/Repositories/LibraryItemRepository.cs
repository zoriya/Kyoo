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
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Utils;

namespace Kyoo.Core.Controllers
{
	/// <summary>
	/// A local repository to handle library items.
	/// </summary>
	public class LibraryItemRepository : DapperRepository<ILibraryItem>
	{
		// language=PostgreSQL
		protected override FormattableString Sql => $"""
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
				full outer join(
					select
						* -- Collection
					from
						collections) as c on false
		""";

		protected override Dictionary<string, Type> Config => new()
		{
			{ "s", typeof(Show) },
			{ "m", typeof(Movie) },
			{ "c", typeof(Collection) }
		};

		protected override ILibraryItem Mapper(List<object?> items)
		{
			if (items[0] is Show show && show.Id != 0)
				return show;
			if (items[1] is Movie movie && movie.Id != 0)
				return movie;
			if (items[2] is Collection collection && collection.Id != 0)
				return collection;
			throw new InvalidDataException();
		}

		public LibraryItemRepository(DbConnection database)
			: base(database)
		{ }

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
	}
}
