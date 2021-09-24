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
	/// Endpoint for items that are not part of a specific library.
	/// An item can ether represent a collection or a show.
	/// </summary>
	[Route("api/items")]
	[Route("api/item", Order = AlternativeRoute)]
	[ApiController]
	[ResourceView]
	[ApiDefinition("Items", Group = ResourcesGroup)]
	public class LibraryItemApi : BaseApi
	{
		/// <summary>
		/// The library item repository used to modify or retrieve information in the data store.
		/// </summary>
		private readonly ILibraryItemRepository _libraryItems;

		/// <summary>
		/// Create a new <see cref="LibraryItemApi"/>.
		/// </summary>
		/// <param name="libraryItems">
		/// The library item repository used to modify or retrieve information in the data store.
		/// </param>
		public LibraryItemApi(ILibraryItemRepository libraryItems)
		{
			_libraryItems = libraryItems;
		}

		/// <summary>
		/// Get items
		/// </summary>
		/// <remarks>
		/// List all items of kyoo.
		/// An item can ether represent a collection or a show.
		/// This endpoint allow one to retrieve all collections and shows that are not contained in a collection.
		/// This is what is displayed on the /browse page of the webapp.
		/// </remarks>
		/// <param name="sortBy">A key to sort items by.</param>
		/// <param name="where">An optional list of filters.</param>
		/// <param name="limit">The number of items to return.</param>
		/// <param name="afterID">An optional item's ID to start the query from this specific item.</param>
		/// <returns>A page of items.</returns>
		/// <response code="400">The filters or the sort parameters are invalid.</response>
		/// <response code="404">No library with the given ID or slug could be found.</response>
		[HttpGet]
		[Permission(nameof(LibraryItemApi), Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<ActionResult<Page<LibraryItem>>> GetAll(
			[FromQuery] string sortBy,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 50,
			[FromQuery] int? afterID = null)
		{
			try
			{
				ICollection<LibraryItem> resources = await _libraryItems.GetAll(
					ApiHelper.ParseWhere<LibraryItem>(where),
					new Sort<LibraryItem>(sortBy),
					new Pagination(limit, afterID)
				);

				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new RequestError(ex.Message));
			}
		}
	}
}
