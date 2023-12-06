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
using Kyoo.Authentication;
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
		/// <param name="thumbs">The thumbnail manager used to retrieve images paths.</param>
		public ShowApi(ILibraryManager libraryManager,
			IThumbnailsManager thumbs)
			: base(libraryManager.Shows, thumbs)
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
		/// <param name="filter">An optional list of filters.</param>
		/// <param name="pagination">The number of seasons to return.</param>
		/// <param name="fields">The aditional fields to include in the result.</param>
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
			[FromQuery] Sort<Season> sortBy,
			[FromQuery] Filter<Season>? filter,
			[FromQuery] Pagination pagination,
			[FromQuery] Include<Season> fields)
		{
			ICollection<Season> resources = await _libraryManager.Seasons.GetAll(
				Filter.And(filter, identifier.Matcher<Season>(x => x.ShowId, x => x.Show!.Slug)),
				sortBy,
				fields,
				pagination
			);

			if (!resources.Any() && await _libraryManager.Shows.GetOrDefault(identifier.IsSame<Show>()) == null)
				return NotFound();
			return Page(resources, pagination.Limit);
		}

		/// <summary>
		/// Get episodes of this show
		/// </summary>
		/// <remarks>
		/// List the episodes that are part of the specified show.
		/// </remarks>
		/// <param name="identifier">The ID or slug of the <see cref="Show"/>.</param>
		/// <param name="sortBy">A key to sort episodes by.</param>
		/// <param name="filter">An optional list of filters.</param>
		/// <param name="pagination">The number of episodes to return.</param>
		/// <param name="fields">The aditional fields to include in the result.</param>
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
			[FromQuery] Sort<Episode> sortBy,
			[FromQuery] Filter<Episode>? filter,
			[FromQuery] Pagination pagination,
			[FromQuery] Include<Episode> fields)
		{
			ICollection<Episode> resources = await _libraryManager.Episodes.GetAll(
				Filter.And(filter, identifier.Matcher<Episode>(x => x.ShowId, x => x.Show!.Slug)),
				sortBy,
				fields,
				pagination
			);

			if (!resources.Any() && await _libraryManager.Shows.GetOrDefault(identifier.IsSame<Show>()) == null)
				return NotFound();
			return Page(resources, pagination.Limit);
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
		// /// <param name="fields">The aditional fields to include in the result.</param>
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
		// 	[FromQuery] Sort<PeopleRole> sortBy,
		// 	[FromQuery] Dictionary<string, string> where,
		// 	[FromQuery] Pagination pagination,
		// 	[FromQuery] Include<PeopleRole> fields)
		// {
		// 	Expression<Func<PeopleRole, bool>>? whereQuery = ApiHelper.ParseWhere<PeopleRole>(where);
		//
		// 	ICollection<PeopleRole> resources = await identifier.Match(
		// 		id => _libraryManager.GetPeopleFromShow(id, whereQuery, sortBy, pagination),
		// 		slug => _libraryManager.GetPeopleFromShow(slug, whereQuery, sortBy, pagination)
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
			return await _libraryManager.Studios.Get(identifier.IsContainedIn<Studio, Show>(x => x.Shows!), fields);
		}

		/// <summary>
		/// Get collections containing this show
		/// </summary>
		/// <remarks>
		/// List the collections that contain this show.
		/// </remarks>
		/// <param name="identifier">The ID or slug of the <see cref="Show"/>.</param>
		/// <param name="sortBy">A key to sort collections by.</param>
		/// <param name="filter">An optional list of filters.</param>
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
			[FromQuery] Filter<Collection>? filter,
			[FromQuery] Pagination pagination,
			[FromQuery] Include<Collection> fields)
		{
			ICollection<Collection> resources = await _libraryManager.Collections.GetAll(
				Filter.And(filter, identifier.IsContainedIn<Collection, Show>(x => x.Shows!)),
				sortBy,
				fields,
				pagination
			);

			if (!resources.Any() && await _libraryManager.Shows.GetOrDefault(identifier.IsSame<Show>()) == null)
				return NotFound();
			return Page(resources, pagination.Limit);
		}

		/// <summary>
		/// Get watch status
		/// </summary>
		/// <remarks>
		/// Get when an item has been wathed and if it was watched.
		/// </remarks>
		/// <param name="identifier">The ID or slug of the <see cref="Show"/>.</param>
		/// <returns>The status.</returns>
		/// <response code="204">This show does not have a specific status.</response>
		/// <response code="404">No show with the given ID or slug could be found.</response>
		[HttpGet("{identifier:id}/watchStatus")]
		[HttpGet("{identifier:id}/watchStatus", Order = AlternativeRoute)]
		[UserOnly]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status204NoContent)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<ShowWatchStatus?> GetWatchStatus(Identifier identifier)
		{
			Guid id = await identifier.Match(
				id => Task.FromResult(id),
				async slug => (await _libraryManager.Shows.Get(slug)).Id
			);
			return await _libraryManager.WatchStatus.GetShowStatus(id, User.GetId()!.Value);
		}

		/// <summary>
		/// Set watch status
		/// </summary>
		/// <remarks>
		/// Set when an item has been wathed and if it was watched.
		/// </remarks>
		/// <param name="identifier">The ID or slug of the <see cref="Show"/>.</param>
		/// <param name="status">The new watch status.</param>
		/// <returns>The newly set status.</returns>
		/// <response code="200">The status has been set</response>
		/// <response code="204">The status was not considered impactfull enough to be saved (less then 5% of watched for example).</response>
		/// <response code="404">No movie with the given ID or slug could be found.</response>
		[HttpPost("{identifier:id}/watchStatus")]
		[HttpPost("{identifier:id}/watchStatus", Order = AlternativeRoute)]
		[UserOnly]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status204NoContent)]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<ShowWatchStatus?> SetWatchStatus(Identifier identifier, WatchStatus status)
		{
			Guid id = await identifier.Match(
				id => Task.FromResult(id),
				async slug => (await _libraryManager.Shows.Get(slug)).Id
			);
			return await _libraryManager.WatchStatus.SetShowStatus(
				id,
				User.GetId()!.Value,
				status
			);
		}

		/// <summary>
		/// Delete watch status
		/// </summary>
		/// <remarks>
		/// Delete watch status (to rewatch for example).
		/// </remarks>
		/// <param name="identifier">The ID or slug of the <see cref="Show"/>.</param>
		/// <returns>The newly set status.</returns>
		/// <response code="204">The status has been deleted.</response>
		/// <response code="404">No show with the given ID or slug could be found.</response>
		[HttpDelete("{identifier:id}/watchStatus")]
		[HttpDelete("{identifier:id}/watchStatus", Order = AlternativeRoute)]
		[UserOnly]
		[ProducesResponseType(StatusCodes.Status204NoContent)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task DeleteWatchStatus(Identifier identifier)
		{
			Guid id = await identifier.Match(
				id => Task.FromResult(id),
				async slug => (await _libraryManager.Shows.Get(slug)).Id
			);
			await _libraryManager.WatchStatus.DeleteShowStatus(id, User.GetId()!.Value);
		}
	}
}
