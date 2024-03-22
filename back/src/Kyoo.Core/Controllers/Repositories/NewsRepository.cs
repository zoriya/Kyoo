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
using Kyoo.Abstractions.Models;

namespace Kyoo.Core.Controllers;

/// <summary>
/// A local repository to handle shows
/// </summary>
public class NewsRepository : DapperRepository<INews>
{
	// language=PostgreSQL
	protected override FormattableString Sql =>
		$"""
			select
				e.*, -- Episode as e
				m.*
				/* includes */
			from
				episodes as e
			full outer join (
				select
					* -- Movie
				from
					movies
			) as m on false
			""";

	protected override Dictionary<string, Type> Config =>
		new() { { "e", typeof(Episode) }, { "m", typeof(Movie) }, };

	protected override INews Mapper(List<object?> items)
	{
		if (items[0] is Episode episode && episode.Id != Guid.Empty)
			return episode;
		if (items[1] is Movie movie && movie.Id != Guid.Empty)
			return movie;
		throw new InvalidDataException();
	}

	public NewsRepository(DbConnection database, SqlVariableContext context)
		: base(database, context) { }
}
