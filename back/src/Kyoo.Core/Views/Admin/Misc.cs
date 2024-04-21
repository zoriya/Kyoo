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
using System.Threading.Tasks;
using Kyoo.Abstractions.Models.Permissions;
using Kyoo.Core.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Core.Api;

/// <summary>
/// Private APIs only used for other services. Can change at any time without notice.
/// </summary>
[ApiController]
[Permission(nameof(Misc), Kind.Read, Group = Group.Admin)]
public class Misc(MiscRepository repo) : BaseApi
{
	/// <summary>
	/// List all registered paths.
	/// </summary>
	/// <returns>The list of paths known to Kyoo.</returns>
	[HttpGet("/paths")]
	[ProducesResponseType(StatusCodes.Status200OK)]
	public Task<ICollection<string>> GetAllPaths()
	{
		return repo.GetRegisteredPaths();
	}
}
