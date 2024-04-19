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

using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Utils;
using Kyoo.Postgresql;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Core.Controllers;

/// <summary>
/// A local repository to handle studios
/// </summary>
public class StudioRepository(DatabaseContext database) : GenericRepository<Studio>(database)
{
	/// <inheritdoc />
	public override async Task<ICollection<Studio>> Search(
		string query,
		Include<Studio>? include = default
	)
	{
		return await AddIncludes(Database.Studios, include)
			.Where(x => EF.Functions.ILike(x.Name, $"%{query}%"))
			.Take(20)
			.ToListAsync();
	}
}
