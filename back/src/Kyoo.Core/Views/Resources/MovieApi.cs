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

namespace Kyoo.Core.Api
{
	/// <summary>
	/// Information about one or multiple <see cref="Movie"/>.
	/// </summary>
	[Route("movies")]
	[Route("movie", Order = AlternativeRoute)]
	[ApiController]
	[PartialPermission(nameof(Show))]
	[ApiDefinition("Shows", Group = ResourcesGroup)]
	public class MovieApi : CrudThumbsApi<Movie>
	{
		/// <summary>
		/// The library manager used to modify or retrieve information in the data store.
		/// </summary>
		private readonly ILibraryManager _libraryManager;

		/// <summary>
		/// Create a new <see cref="ShowApi"/>.
		/// </summary>
		/// <param name="libraryManager">
		/// The library manager used to modify or retrieve information about the data store.
		/// </param>
		/// <param name="thumbs">The thumbnail manager used to retrieve images paths.</param>
		public MovieApi(ILibraryManager libraryManager,
			IThumbnailsManager thumbs)
			: base(libraryManager.Movies, thumbs)
		{
			_libraryManager = libraryManager;
		}

		// /// <summary>
		// /// Get staff
		// /// </summary>
		// /// <remarks>
		// /// List staff members that made this show.
		// /// </remarks>
		// /// <param name="identifier">The ID or slug of the <see cref="Show"/>.</param>
		// /// <param name="sortBy">A key to sort staff members by.</param>
		// /// <param name="where">An optional list of filters.</param>
		// /// <param name="pagination">The number of people to return.</param>
		// /// <returns>A page of people.</returns>
		// /// <response code="400">The filters or the sort parameters are invalid.</response>
		// /// <response code="404">No show with the given ID or slug could be found.</response>
		// [HttpGet("{identifier:id}/staff")]
		// [HttpGet("{identifier:id}/people", Order = AlternativeRoute)]
		// [PartialPermission(Kind.Read)]
		// [ProducesResponseType(StatusCodes.Status200OK)]
		// [ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
		// [ProducesResponseType(StatusCodes.Status404NotFound)]
		// public async Task<ActionResult<Page<PeopleRole>>> GetPeople(Identifier identifier,
		// 	[FromQuery] string sortBy,
		// 	[FromQuery] Dictionary<string, string> where,
		// 	[FromQuery] Pagination pagination)
		// {
		// 	Expression<Func<PeopleRole, bool>> whereQuery = ApiHelper.ParseWhere<PeopleRole>(where);
		// 	Sort<PeopleRole> sort = Sort<PeopleRole>.From(sortBy);
		//
		// 	ICollection<PeopleRole> resources = await identifier.Match(
		// 		id => _libraryManager.GetPeopleFromShow(id, whereQuery, sort, pagination),
		// 		slug => _libraryManager.GetPeopleFromShow(slug, whereQuery, sort, pagination)
		// 	);
		// 	return Page(resources, pagination.Limit);
		// }

		/// <summary>
		/// Get studio that made the show
		/// </summary>
		/// <remarks>
		/// Get the studio that made the show.
		/// </remarks>
		/// <param name="identifier">The ID or slug of the <see cref="Show"/>.</param>
		/// <param name="fields">The aditional fields to include in the result.</param>
		/// <returns>The studio that made the show.</returns>
		/// <response code="404">No show with the given ID or slug could be found.</response>
		[HttpGet("{identifier:id}/studio")]
		[PartialPermission(Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<ActionResult<Studio>> GetStudio(Identifier identifier, [FromQuery] Include<Studio> fields)
		{
			return await _libraryManager.Studios.Get(identifier.IsContainedIn<Studio, Movie>(x => x.Movies!), fields);
		}

		/// <summary>
		/// Get collections containing this show
		/// </summary>
		/// <remarks>
		/// List the collections that contain this show.
		/// </remarks>
		/// <param name="identifier">The ID or slug of the <see cref="Show"/>.</param>
		/// <param name="sortBy">A key to sort collections by.</param>
		/// <param name="where">An optional list of filters.</param>
		/// <param name="pagination">The number of collections to return.</param>
		/// <param name="fields">The aditional fields to include in the result.</param>
		/// <returns>A page of collections.</returns>
		/// <response code="400">The filters or the sort parameters are invalid.</response>
		/// <response code="404">No show with the given ID or slug could be found.</response>
		[HttpGet("{identifier:id}/collections")]
		[HttpGet("{identifier:id}/collection", Order = AlternativeRoute)]
		[PartialPermission(Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<ActionResult<Page<Collection>>> GetCollections(Identifier identifier,
			[FromQuery] Sort<Collection> sortBy,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] Pagination pagination,
			[FromQuery] Include<Collection> fields)
		{
			ICollection<Collection> resources = await _libraryManager.Collections.GetAll(
				ApiHelper.ParseWhere(where, identifier.IsContainedIn<Collection, Movie>(x => x.Movies!)),
				sortBy,
				pagination,
				fields
			);

			if (!resources.Any() && await _libraryManager.Movies.GetOrDefault(identifier.IsSame<Movie>()) == null)
				return NotFound();
			return Page(resources, pagination.Limit);
		}
	}
}
