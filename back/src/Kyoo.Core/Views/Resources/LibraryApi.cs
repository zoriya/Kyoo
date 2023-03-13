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
using System.Linq;
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
	/// Information about one or multiple <see cref="Library"/>.
	/// </summary>
	[Route("libraries")]
	[Route("library", Order = AlternativeRoute)]
	[ApiController]
	[ResourceView]
	[PartialPermission(nameof(Library), Group = Group.Admin)]
	[ApiDefinition("Library", Group = ResourcesGroup)]
	public class LibraryApi : CrudApi<Library>
	{
		/// <summary>
		/// The library manager used to modify or retrieve information in the data store.
		/// </summary>
		private readonly ILibraryManager _libraryManager;

		/// <summary>
		/// Create a new <see cref="EpisodeApi"/>.
		/// </summary>
		/// <param name="libraryManager">
		/// The library manager used to modify or retrieve information in the data store.
		/// </param>
		public LibraryApi(ILibraryManager libraryManager)
			: base(libraryManager.LibraryRepository)
		{
			_libraryManager = libraryManager;
		}

		/// <summary>
		/// Get shows
		/// </summary>
		/// <remarks>
		/// List the shows that are part of this library.
		/// </remarks>
		/// <param name="identifier">The ID or slug of the <see cref="Library"/>.</param>
		/// <param name="sortBy">A key to sort shows by.</param>
		/// <param name="where">An optional list of filters.</param>
		/// <param name="pagination">The number of shows to return.</param>
		/// <returns>A page of shows.</returns>
		/// <response code="400">The filters or the sort parameters are invalid.</response>
		/// <response code="404">No library with the given ID or slug could be found.</response>
		[HttpGet("{identifier:id}/shows")]
		[HttpGet("{identifier:id}/show", Order = AlternativeRoute)]
		[PartialPermission(Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<ActionResult<Page<Show>>> GetShows(Identifier identifier,
			[FromQuery] string sortBy,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] Pagination pagination)
		{
			ICollection<Show> resources = await _libraryManager.GetAll(
				ApiHelper.ParseWhere(where, identifier.IsContainedIn<Show, Library>(x => x.Libraries)),
				Sort<Show>.From(sortBy),
				pagination
			);

			if (!resources.Any() && await _libraryManager.GetOrDefault(identifier.IsSame<Library>()) == null)
				return NotFound();
			return Page(resources, pagination.Limit);
		}

		/// <summary>
		/// Get collections
		/// </summary>
		/// <remarks>
		/// List the collections that are part of this library.
		/// </remarks>
		/// <param name="identifier">The ID or slug of the <see cref="Library"/>.</param>
		/// <param name="sortBy">A key to sort collections by.</param>
		/// <param name="where">An optional list of filters.</param>
		/// <param name="pagination">The number of collections to return.</param>
		/// <returns>A page of collections.</returns>
		/// <response code="400">The filters or the sort parameters are invalid.</response>
		/// <response code="404">No library with the given ID or slug could be found.</response>
		[HttpGet("{identifier:id}/collections")]
		[HttpGet("{identifier:id}/collection", Order = AlternativeRoute)]
		[PartialPermission(Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<ActionResult<Page<Collection>>> GetCollections(Identifier identifier,
			[FromQuery] string sortBy,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] Pagination pagination)
		{
			ICollection<Collection> resources = await _libraryManager.GetAll(
				ApiHelper.ParseWhere(where, identifier.IsContainedIn<Collection, Library>(x => x.Libraries)),
				Sort<Collection>.From(sortBy),
				pagination
			);

			if (!resources.Any() && await _libraryManager.GetOrDefault(identifier.IsSame<Library>()) == null)
				return NotFound();
			return Page(resources, pagination.Limit);
		}

		/// <summary>
		/// Get items
		/// </summary>
		/// <remarks>
		/// List all items of this library.
		/// An item can ether represent a collection or a show.
		/// This endpoint allow one to retrieve all collections and shows that are not contained in a collection.
		/// This is what is displayed on the /browse/library page of the webapp.
		/// </remarks>
		/// <param name="identifier">The ID or slug of the <see cref="Library"/>.</param>
		/// <param name="sortBy">A key to sort items by.</param>
		/// <param name="where">An optional list of filters.</param>
		/// <param name="pagination">The number of items to return.</param>
		/// <returns>A page of items.</returns>
		/// <response code="400">The filters or the sort parameters are invalid.</response>
		/// <response code="404">No library with the given ID or slug could be found.</response>
		[HttpGet("{identifier:id}/items")]
		[HttpGet("{identifier:id}/item", Order = AlternativeRoute)]
		[PartialPermission(Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<ActionResult<Page<LibraryItem>>> GetItems(Identifier identifier,
			[FromQuery] string sortBy,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] Pagination pagination)
		{
			Expression<Func<LibraryItem, bool>> whereQuery = ApiHelper.ParseWhere<LibraryItem>(where);
			Sort<LibraryItem> sort = Sort<LibraryItem>.From(sortBy);

			ICollection<LibraryItem> resources = await identifier.Match(
				id => _libraryManager.GetItemsFromLibrary(id, whereQuery, sort, pagination),
				slug => _libraryManager.GetItemsFromLibrary(slug, whereQuery, sort, pagination)
			);

			return Page(resources, pagination.Limit);
		}
	}
}
