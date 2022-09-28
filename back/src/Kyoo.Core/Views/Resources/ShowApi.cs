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
using Kyoo.Abstractions.Models.Exceptions;
using Kyoo.Abstractions.Models.Permissions;
using Kyoo.Abstractions.Models.Utils;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using static Kyoo.Abstractions.Models.Utils.Constants;

namespace Kyoo.Core.Api
{
	/// <summary>
	/// Information about one or multiple <see cref="Show"/>.
	/// </summary>
	[Route("shows")]
	[Route("show", Order = AlternativeRoute)]
	[Route("movie", Order = AlternativeRoute)]
	[Route("movies", Order = AlternativeRoute)]
	[ApiController]
	[PartialPermission(nameof(Show))]
	[ApiDefinition("Shows", Group = ResourcesGroup)]
	public class ShowApi : CrudThumbsApi<Show>
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
		/// <param name="files">The file manager used to send images and fonts.</param>
		/// <param name="thumbs">The thumbnail manager used to retrieve images paths.</param>
		public ShowApi(ILibraryManager libraryManager,
			IFileSystem files,
			IThumbnailsManager thumbs)
			: base(libraryManager.ShowRepository, files, thumbs)
		{
			_libraryManager = libraryManager;
		}

		/// <summary>
		/// Get seasons of this show
		/// </summary>
		/// <remarks>
		/// List the seasons that are part of the specified show.
		/// </remarks>
		/// <param name="identifier">The ID or slug of the <see cref="Show"/>.</param>
		/// <param name="sortBy">A key to sort seasons by.</param>
		/// <param name="where">An optional list of filters.</param>
		/// <param name="limit">The number of seasons to return.</param>
		/// <param name="afterID">An optional season's ID to start the query from this specific item.</param>
		/// <returns>A page of seasons.</returns>
		/// <response code="400">The filters or the sort parameters are invalid.</response>
		/// <response code="404">No show with the given ID or slug could be found.</response>
		[HttpGet("{identifier:id}/seasons")]
		[HttpGet("{identifier:id}/season", Order = AlternativeRoute)]
		[PartialPermission(Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<ActionResult<Page<Season>>> GetSeasons(Identifier identifier,
			[FromQuery] string sortBy,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 20,
			[FromQuery] int? afterID = null)
		{
			try
			{
				ICollection<Season> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere(where, identifier.Matcher<Season>(x => x.ShowID, x => x.Show.Slug)),
					new Sort<Season>(sortBy),
					new Pagination(limit, afterID)
				);

				if (!resources.Any() && await _libraryManager.GetOrDefault(identifier.IsSame<Show>()) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new RequestError(ex.Message));
			}
		}

		/// <summary>
		/// Get episodes of this show
		/// </summary>
		/// <remarks>
		/// List the episodes that are part of the specified show.
		/// </remarks>
		/// <param name="identifier">The ID or slug of the <see cref="Show"/>.</param>
		/// <param name="sortBy">A key to sort episodes by.</param>
		/// <param name="where">An optional list of filters.</param>
		/// <param name="limit">The number of episodes to return.</param>
		/// <param name="afterID">An optional episode's ID to start the query from this specific item.</param>
		/// <returns>A page of episodes.</returns>
		/// <response code="400">The filters or the sort parameters are invalid.</response>
		/// <response code="404">No show with the given ID or slug could be found.</response>
		[HttpGet("{identifier:id}/episodes")]
		[HttpGet("{identifier:id}/episode", Order = AlternativeRoute)]
		[PartialPermission(Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<ActionResult<Page<Episode>>> GetEpisodes(Identifier identifier,
			[FromQuery] string sortBy,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 50,
			[FromQuery] int? afterID = null)
		{
			try
			{
				ICollection<Episode> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere(where, identifier.Matcher<Episode>(x => x.ShowID, x => x.Show.Slug)),
					new Sort<Episode>(sortBy),
					new Pagination(limit, afterID)
				);

				if (!resources.Any() && await _libraryManager.GetOrDefault(identifier.IsSame<Show>()) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new RequestError(ex.Message));
			}
		}

		/// <summary>
		/// Get staff
		/// </summary>
		/// <remarks>
		/// List staff members that made this show.
		/// </remarks>
		/// <param name="identifier">The ID or slug of the <see cref="Show"/>.</param>
		/// <param name="sortBy">A key to sort staff members by.</param>
		/// <param name="where">An optional list of filters.</param>
		/// <param name="limit">The number of people to return.</param>
		/// <param name="afterID">An optional person's ID to start the query from this specific item.</param>
		/// <returns>A page of people.</returns>
		/// <response code="400">The filters or the sort parameters are invalid.</response>
		/// <response code="404">No show with the given ID or slug could be found.</response>
		[HttpGet("{identifier:id}/staff")]
		[HttpGet("{identifier:id}/people", Order = AlternativeRoute)]
		[PartialPermission(Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<ActionResult<Page<PeopleRole>>> GetPeople(Identifier identifier,
			[FromQuery] string sortBy,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30,
			[FromQuery] int? afterID = null)
		{
			try
			{
				Expression<Func<PeopleRole, bool>> whereQuery = ApiHelper.ParseWhere<PeopleRole>(where);
				Sort<PeopleRole> sort = new(sortBy);
				Pagination pagination = new(limit, afterID);

				ICollection<PeopleRole> resources = await identifier.Match(
					id => _libraryManager.GetPeopleFromShow(id, whereQuery, sort, pagination),
					slug => _libraryManager.GetPeopleFromShow(slug, whereQuery, sort, pagination)
				);
				return Page(resources, limit);
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new RequestError(ex.Message));
			}
		}

		/// <summary>
		/// Get genres of this show
		/// </summary>
		/// <remarks>
		/// List the genres that represent this show.
		/// </remarks>
		/// <param name="identifier">The ID or slug of the <see cref="Show"/>.</param>
		/// <param name="sortBy">A key to sort genres by.</param>
		/// <param name="where">An optional list of filters.</param>
		/// <param name="limit">The number of genres to return.</param>
		/// <param name="afterID">An optional genre's ID to start the query from this specific item.</param>
		/// <returns>A page of genres.</returns>
		/// <response code="400">The filters or the sort parameters are invalid.</response>
		/// <response code="404">No show with the given ID or slug could be found.</response>
		[HttpGet("{identifier:id}/genres")]
		[HttpGet("{identifier:id}/genre", Order = AlternativeRoute)]
		[PartialPermission(Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<ActionResult<Page<Genre>>> GetGenres(Identifier identifier,
			[FromQuery] string sortBy,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30,
			[FromQuery] int? afterID = null)
		{
			try
			{
				ICollection<Genre> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere(where, identifier.IsContainedIn<Genre, Show>(x => x.Shows)),
					new Sort<Genre>(sortBy),
					new Pagination(limit, afterID)
				);

				if (!resources.Any() && await _libraryManager.GetOrDefault(identifier.IsSame<Show>()) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new RequestError(ex.Message));
			}
		}

		/// <summary>
		/// Get studio that made the show
		/// </summary>
		/// <remarks>
		/// Get the studio that made the show.
		/// </remarks>
		/// <param name="identifier">The ID or slug of the <see cref="Show"/>.</param>
		/// <returns>The studio that made the show.</returns>
		/// <response code="404">No show with the given ID or slug could be found.</response>
		[HttpGet("{identifier:id}/studio")]
		[PartialPermission(Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<ActionResult<Studio>> GetStudio(Identifier identifier)
		{
			Studio studio = await _libraryManager.GetOrDefault(identifier.IsContainedIn<Studio, Show>(x => x.Shows));
			if (studio == null)
				return NotFound();
			return studio;
		}

		/// <summary>
		/// Get libraries containing this show
		/// </summary>
		/// <remarks>
		/// List the libraries that contain this show. If this show is contained in a collection that is contained in
		/// a library, this library will be returned too.
		/// </remarks>
		/// <param name="identifier">The ID or slug of the <see cref="Show"/>.</param>
		/// <param name="sortBy">A key to sort libraries by.</param>
		/// <param name="where">An optional list of filters.</param>
		/// <param name="limit">The number of libraries to return.</param>
		/// <param name="afterID">An optional library's ID to start the query from this specific item.</param>
		/// <returns>A page of libraries.</returns>
		/// <response code="400">The filters or the sort parameters are invalid.</response>
		/// <response code="404">No show with the given ID or slug could be found.</response>
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
					ApiHelper.ParseWhere(where, identifier.IsContainedIn<Library, Show>(x => x.Shows)),
					new Sort<Library>(sortBy),
					new Pagination(limit, afterID)
				);

				if (!resources.Any() && await _libraryManager.GetOrDefault(identifier.IsSame<Show>()) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new RequestError(ex.Message));
			}
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
		/// <param name="limit">The number of collections to return.</param>
		/// <param name="afterID">An optional collection's ID to start the query from this specific item.</param>
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
			[FromQuery] string sortBy,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30,
			[FromQuery] int? afterID = null)
		{
			try
			{
				ICollection<Collection> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere(where, identifier.IsContainedIn<Collection, Show>(x => x.Shows)),
					new Sort<Collection>(sortBy),
					new Pagination(limit, afterID)
				);

				if (!resources.Any() && await _libraryManager.GetOrDefault(identifier.IsSame<Show>()) == null)
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
