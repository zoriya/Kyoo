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
/// Information about one or multiple <see cref="Studio"/>.
/// </summary>
[Route("studios")]
[Route("studio", Order = AlternativeRoute)]
[ApiController]
[PartialPermission(nameof(Show))]
[ApiDefinition("Studios", Group = MetadataGroup)]
public class StudioApi : CrudApi<Studio>
{
	/// <summary>
	/// The library manager used to modify or retrieve information in the data store.
	/// </summary>
	private readonly ILibraryManager _libraryManager;

	/// <summary>
	/// Create a new <see cref="StudioApi"/>.
	/// </summary>
	/// <param name="libraryManager">
	/// The library manager used to modify or retrieve information in the data store.
	/// </param>
	public StudioApi(ILibraryManager libraryManager)
		: base(libraryManager.Studios)
	{
		_libraryManager = libraryManager;
	}

	/// <summary>
	/// Get shows
	/// </summary>
	/// <remarks>
	/// List shows that were made by this specific studio.
	/// </remarks>
	/// <param name="identifier">The ID or slug of the <see cref="Studio"/>.</param>
	/// <param name="sortBy">A key to sort shows by.</param>
	/// <param name="filter">An optional list of filters.</param>
	/// <param name="pagination">The number of shows to return.</param>
	/// <param name="fields">The aditional fields to include in the result.</param>
	/// <returns>A page of shows.</returns>
	/// <response code="400">The filters or the sort parameters are invalid.</response>
	/// <response code="404">No studio with the given ID or slug could be found.</response>
	[HttpGet("{identifier:id}/shows")]
	[HttpGet("{identifier:id}/show", Order = AlternativeRoute)]
	[PartialPermission(Kind.Read)]
	[ProducesResponseType(StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	public async Task<ActionResult<Page<Show>>> GetShows(
		Identifier identifier,
		[FromQuery] Sort<Show> sortBy,
		[FromQuery] Filter<Show>? filter,
		[FromQuery] Pagination pagination,
		[FromQuery] Include<Show> fields
	)
	{
		ICollection<Show> resources = await _libraryManager.Shows.GetAll(
			Filter.And(filter, identifier.Matcher<Show>(x => x.StudioId, x => x.Studio!.Slug)),
			sortBy,
			fields,
			pagination
		);

		if (
			!resources.Any()
			&& await _libraryManager.Studios.GetOrDefault(identifier.IsSame<Studio>()) == null
		)
			return NotFound();
		return Page(resources, pagination.Limit);
	}
}
