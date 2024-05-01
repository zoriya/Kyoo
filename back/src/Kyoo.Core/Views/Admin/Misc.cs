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
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models.Permissions;
using Kyoo.Core.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Core.Api;

/// <summary>
/// Private APIs only used for other services. Can change at any time without notice.
/// </summary>
[ApiController]
[PartialPermission(nameof(Misc), Group = Group.Admin)]
public class Misc(MiscRepository repo) : BaseApi
{
	/// <summary>
	/// List all registered paths.
	/// </summary>
	/// <returns>The list of paths known to Kyoo.</returns>
	[HttpGet("/paths")]
	[PartialPermission(Kind.Read)]
	[ProducesResponseType(StatusCodes.Status200OK)]
	public Task<ICollection<string>> GetAllPaths()
	{
		return repo.GetRegisteredPaths();
	}

	/// <summary>
	/// Delete item at path.
	/// </summary>
	/// <param name="path">The path to delete.</param>
	/// <param name="recursive">
	/// If true, the path will be considered as a directory and every children will be removed.
	/// </param>
	/// <returns>Nothing</returns>
	[HttpDelete("/paths")]
	[PartialPermission(Kind.Delete)]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	public async Task<IActionResult> DeletePath(
		[FromQuery] string path,
		[FromQuery] bool recursive = false
	)
	{
		await repo.DeletePath(path, recursive);
		return NoContent();
	}

	/// <summary>
	/// Rescan library
	/// </summary>
	/// <remark>
	/// Trigger a complete library rescan
	/// </remark>
	/// <returns>Nothing</returns>
	[HttpPost("/rescan")]
	[PartialPermission(Kind.Write)]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	public async Task<IActionResult> RescanLibrary([FromServices] IScanner scanner)
	{
		await scanner.SendRescanRequest();
		return NoContent();
	}

	/// <summary>
	/// List items to refresh.
	/// </summary>
	/// <param name="date">The upper limit for the refresh date.</param>
	/// <returns>The items that should be refreshed before the given date</returns>
	[HttpGet("/refreshables")]
	[PartialPermission(Kind.Read)]
	[ProducesResponseType(StatusCodes.Status200OK)]
	public Task<ICollection<RefreshableItem>> GetAllPaths([FromQuery] DateTime? date)
	{
		return repo.GetRefreshableItems(date ?? DateTime.UtcNow);
	}
}
