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
	/// Information about one or multiple <see cref="Collection"/>.
	/// </summary>
	[Route("api/collections")]
	[Route("api/collection", Order = AlternativeRoute)]
	[ApiController]
	[PartialPermission(nameof(Collection))]
	[ApiDefinition("Collections", Group = ResourcesGroup)]
	public class CollectionApi : CrudThumbsApi<Collection>
	{
		/// <summary>
		/// The library manager used to modify or retrieve information about the data store.
		/// </summary>
		private readonly ILibraryManager _libraryManager;

		/// <summary>
		/// Create a new <see cref="CollectionApi"/>.
		/// </summary>
		/// <param name="libraryManager">
		/// The library manager used to modify or retrieve information about the data store.
		/// </param>
		/// <param name="files">The file manager used to send images.</param>
		/// <param name="thumbs">The thumbnail manager used to retrieve images paths.</param>
		public CollectionApi(ILibraryManager libraryManager,
			IFileSystem files,
			IThumbnailsManager thumbs)
			: base(libraryManager.CollectionRepository, files, thumbs)
		{
			_libraryManager = libraryManager;
		}

		/// <summary>
		/// Get shows in collection
		/// </summary>
		/// <remarks>
		/// Lists the shows that are contained in the collection with the given id or slug.
		/// </remarks>
		/// <param name="identifier">The ID or slug of the <see cref="Collection"/>.</param>
		/// <param name="sortBy">A key to sort shows by.</param>
		/// <param name="where">An optional list of filters.</param>
		/// <param name="limit">The number of shows to return.</param>
		/// <param name="afterID">An optional show's ID to start the query from this specific item.</param>
		/// <returns>A page of shows.</returns>
		/// <response code="400">The filters or the sort parameters are invalid.</response>
		/// <response code="404">No collection with the given ID could be found.</response>
		[HttpGet("{identifier:id}/shows")]
		[HttpGet("{identifier:id}/show", Order = AlternativeRoute)]
		[PartialPermission(Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<ActionResult<Page<Show>>> GetShows(Identifier identifier,
			[FromQuery] string sortBy,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30,
			[FromQuery] int? afterID = null)
		{
			try
			{
				ICollection<Show> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere<Show>(where, x => x.Collections.Any(identifier.IsSame)),
					new Sort<Show>(sortBy),
					new Pagination(limit, afterID)
				);

				if (!resources.Any() && await _libraryManager.GetOrDefault(identifier.IsSame<Collection>()) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new RequestError(ex.Message));
			}
		}

		/// <summary>
		/// Get libraries containing this collection
		/// </summary>
		/// <remarks>
		/// Lists the libraries that contain the collection with the given id or slug.
		/// </remarks>
		/// <param name="identifier">The ID or slug of the <see cref="Collection"/>.</param>
		/// <param name="sortBy">A key to sort libraries by.</param>
		/// <param name="where">An optional list of filters.</param>
		/// <param name="limit">The number of libraries to return.</param>
		/// <param name="afterID">An optional library's ID to start the query from this specific item.</param>
		/// <returns>A page of libraries.</returns>
		/// <response code="400">The filters or the sort parameters are invalid.</response>
		/// <response code="404">No collection with the given ID or slug could be found.</response>
		[HttpGet("{identifier:id}/libraries")]
		[HttpGet("{identifier:id}/library", Order = AlternativeRoute)]
		[PartialPermission(Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<ActionResult<Page<Library>>> GetLibraries(Identifier identifier,
			[FromQuery] string sortBy,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30,
			[FromQuery] int? afterID = null)
		{
			try
			{
				ICollection<Library> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere<Library>(where, x => x.Collections.Any(identifier.IsSame)),
					new Sort<Library>(sortBy),
					new Pagination(limit, afterID)
				);

				if (!resources.Any() && await _libraryManager.GetOrDefault(identifier.IsSame<Collection>()) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new RequestError(ex.Message));
			}
		}
	}
}
