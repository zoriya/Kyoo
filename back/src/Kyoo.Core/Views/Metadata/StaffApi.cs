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
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Abstractions.Models.Permissions;
using Kyoo.Abstractions.Models.Utils;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using static Kyoo.Abstractions.Models.Utils.Constants;

namespace Kyoo.Core.Api
{
	/// <summary>
	/// Information about one or multiple staff member.
	/// </summary>
	[Route("staff")]
	[Route("people", Order = AlternativeRoute)]
	[ApiController]
	[ResourceView]
	[PartialPermission(nameof(People))]
	[ApiDefinition("Staff", Group = MetadataGroup)]
	public class StaffApi : CrudThumbsApi<People>
	{
		/// <summary>
		/// The library manager used to modify or retrieve information in the data store.
		/// </summary>
		private readonly ILibraryManager _libraryManager;

		/// <summary>
		/// Create a new <see cref="StaffApi"/>.
		/// </summary>
		/// <param name="libraryManager">
		/// The library manager used to modify or retrieve information about the data store.
		/// </param>
		/// <param name="thumbs">The thumbnail manager used to retrieve images paths.</param>
		public StaffApi(ILibraryManager libraryManager,
			IThumbnailsManager thumbs)
			: base(libraryManager.PeopleRepository, thumbs)
		{
			_libraryManager = libraryManager;
		}

		/// <summary>
		/// Get roles
		/// </summary>
		/// <remarks>
		/// List the roles in witch this person has played, written or worked in a way.
		/// </remarks>
		/// <param name="identifier">The ID or slug of the person.</param>
		/// <param name="sortBy">A key to sort roles by.</param>
		/// <param name="where">An optional list of filters.</param>
		/// <param name="pagination">The number of roles to return.</param>
		/// <returns>A page of roles.</returns>
		/// <response code="400">The filters or the sort parameters are invalid.</response>
		/// <response code="404">No person with the given ID or slug could be found.</response>
		[HttpGet("{identifier:id}/roles")]
		[HttpGet("{identifier:id}/role", Order = AlternativeRoute)]
		[PartialPermission(Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<ActionResult<Page<PeopleRole>>> GetRoles(Identifier identifier,
			[FromQuery] string sortBy,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] Pagination pagination)
		{
			Expression<Func<PeopleRole, bool>> whereQuery = ApiHelper.ParseWhere<PeopleRole>(where);
			Sort<PeopleRole> sort = Sort<PeopleRole>.From(sortBy);

			ICollection<PeopleRole> resources = await identifier.Match(
				id => _libraryManager.GetRolesFromPeople(id, whereQuery, sort, pagination),
				slug => _libraryManager.GetRolesFromPeople(slug, whereQuery, sort, pagination)
			);

			return Page(resources, pagination.Limit);
		}
	}
}
