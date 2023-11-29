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
						c.* -- Collection as c
					from
						collections as c
					left join link_collection_show as ls on ls.collection_id = c.id
					left join link_collection_movie as lm on lm.collection_id = c.id
					group by c.id
					having count(*) > 1
				) as c on false
		""";

		protected override Dictionary<string, Type> Config => new()
		{
			{ "s", typeof(Show) },
			{ "m", typeof(Movie) },
			{ "c", typeof(Collection) }
		};

		protected override ILibraryItem Mapper(List<object?> items)
		{
			if (items[0] is Show show && show.Id != Guid.Empty)
				return show;
			if (items[1] is Movie movie && movie.Id != Guid.Empty)
				return movie;
			if (items[2] is Collection collection && collection.Id != Guid.Empty)
				return collection;
			throw new InvalidDataException();
		}

		public LibraryItemRepository(DbConnection database)
			: base(database)
		{ }

		public async Task<ICollection<ILibraryItem>> GetAllOfCollection(
			Guid collectionId,
			Filter<ILibraryItem>? filter = default,
			Sort<ILibraryItem>? sort = default,
			Include<ILibraryItem>? include = default,
			Pagination? limit = default)
		{
			// language=PostgreSQL
			FormattableString sql = $"""
				select
					s.*,
					m.*
					/* includes */
				from (
					select
						* -- Show
					from
						shows
					inner join link_collection_show as ls on ls.show_id = id and ls.collection_id = {collectionId}
				) as s
				full outer join (
					select
						* -- Movie
					from
						movies
					inner join link_collection_movie as lm on lm.movie_id = id and lm.collection_id = {collectionId}
				) as m on false
			""";

			return await Database.Query<ILibraryItem>(
				sql,
				new()
				{
					{ "s", typeof(Show) },
					{ "m", typeof(Movie) },
				},
				Mapper,
				(id) => Get(id),
				include,
				filter,
				sort ?? new Sort<ILibraryItem>.Default(),
				limit ?? new()
			);
		}
	}
}
