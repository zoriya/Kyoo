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
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Abstractions.Models.Permissions;
using Kyoo.Abstractions.Models.Utils;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using static Kyoo.Abstractions.Models.Utils.Constants;

namespace Kyoo.Core.Api;

/// <summary>
/// Create or list issues on the instance
/// </summary>
[Route("issues")]
[Route("issue", Order = AlternativeRoute)]
[ApiController]
[PartialPermission(nameof(Issue), Group = Group.Admin)]
[ApiDefinition("Issue", Group = AdminGroup)]
public class IssueApi(IIssueRepository issues) : Controller
{
	/// <summary>
	/// Get count
	/// </summary>
	/// <remarks>
	/// Get the number of issues that match the filters.
	/// </remarks>
	/// <param name="filter">A list of filters to respect.</param>
	/// <returns>How many issues matched that filter.</returns>
	/// <response code="400">Invalid filters.</response>
	[HttpGet("count")]
	[PartialPermission(Kind.Read)]
	[ProducesResponseType(StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
	public async Task<ActionResult<int>> GetCount([FromQuery] Filter<Issue> filter)
	{
		return await issues.GetCount(filter);
	}

	/// <summary>
	/// Get all issues
	/// </summary>
	/// <remarks>
	/// Get all issues that match the given filter.
	/// </remarks>
	/// <param name="filter">Filter the returned items.</param>
	/// <returns>A list of issues that match every filters.</returns>
	/// <response code="400">Invalid filters or sort information.</response>
	[HttpGet]
	[PartialPermission(Kind.Read)]
	[ProducesResponseType(StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
	public async Task<ActionResult<ICollection<Issue>>> GetAll([FromQuery] Filter<Issue>? filter)
	{
		return Ok(await issues.GetAll(filter));
	}

	/// <summary>
	/// Upsert issue
	/// </summary>
	/// <remarks>
	/// Create or update an issue.
	/// </remarks>
	/// <param name="issue">The issue to create.</param>
	/// <returns>The created issue.</returns>
	/// <response code="400">The issue in the request body is invalid.</response>
	[HttpPost]
	[PartialPermission(Kind.Create)]
	[ProducesResponseType(StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
	public async Task<ActionResult<Issue>> Create([FromBody] Issue issue)
	{
		return await issues.Upsert(issue);
	}

	/// <summary>
	/// Delete issues
	/// </summary>
	/// <remarks>
	/// Delete all issues matching the given filters.
	/// </remarks>
	/// <param name="filter">The list of filters.</param>
	/// <returns>The item(s) has successfully been deleted.</returns>
	/// <response code="400">One or multiple filters are invalid.</response>
	[HttpDelete]
	[PartialPermission(Kind.Delete)]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
	public async Task<IActionResult> Delete([FromQuery] Filter<Issue> filter)
	{
		if (filter == null)
			return BadRequest(
				new RequestError("Incule a filter to delete items, all items won't be deleted.")
			);

		await issues.DeleteAll(filter);
		return NoContent();
	}
}
