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
	/// Information about one or multiple <see cref="Genre"/>.
	/// </summary>
	[Route("genres")]
	[Route("genre", Order = AlternativeRoute)]
	[ApiController]
	[PartialPermission(nameof(Genre))]
	[ApiDefinition("Genres", Group = MetadataGroup)]
	public class GenreApi : CrudApi<Genre>
	{
		/// <summary>
		/// The library manager used to modify or retrieve information about the data store.
		/// </summary>
		private readonly ILibraryManager _libraryManager;

		/// <summary>
		/// Create a new <see cref="GenreApi"/>.
		/// </summary>
		/// <param name="libraryManager">
		/// The library manager used to modify or retrieve information about the data store.
		/// </param>
		public GenreApi(ILibraryManager libraryManager)
			: base(libraryManager.GenreRepository)
		{
			_libraryManager = libraryManager;
		}

		/// <summary>
		/// Get shows with genre
		/// </summary>
		/// <remarks>
		/// Lists the shows that have the selected genre.
		/// </remarks>
		/// <param name="identifier">The ID or slug of the <see cref="Genre"/>.</param>
		/// <param name="sortBy">A key to sort shows by.</param>
		/// <param name="where">An optional list of filters.</param>
		/// <param name="limit">The number of shows to return.</param>
		/// <param name="afterID">An optional show's ID to start the query from this specific item.</param>
		/// <returns>A page of shows.</returns>
		/// <response code="400">The filters or the sort parameters are invalid.</response>
		/// <response code="404">No genre with the given ID could be found.</response>
		[HttpGet("{identifier:id}/shows")]
		[HttpGet("{identifier:id}/show", Order = AlternativeRoute)]
		[PartialPermission(Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<ActionResult<Page<Show>>> GetShows(Identifier identifier,
			[FromQuery] string sortBy,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 20,
			[FromQuery] int? afterID = null)
		{
			try
			{
				ICollection<Show> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere(where, identifier.IsContainedIn<Show, Genre>(x => x.Genres)),
					new Sort<Show>(sortBy),
					new Pagination(limit, afterID)
				);

				if (!resources.Any() && await _libraryManager.GetOrDefault(identifier.IsSame<Genre>()) == null)
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
