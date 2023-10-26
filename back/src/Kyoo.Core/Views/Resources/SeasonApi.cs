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
	/// Information about one or multiple <see cref="Season"/>.
	/// </summary>
	[Route("seasons")]
	[Route("season", Order = AlternativeRoute)]
	[ApiController]
	[PartialPermission(nameof(Season))]
	[ApiDefinition("Seasons", Group = ResourcesGroup)]
	public class SeasonApi : CrudThumbsApi<Season>
	{
		/// <summary>
		/// The library manager used to modify or retrieve information in the data store.
		/// </summary>
		private readonly ILibraryManager _libraryManager;

		/// <summary>
		/// Create a new <see cref="SeasonApi"/>.
		/// </summary>
		/// <param name="libraryManager">
		/// The library manager used to modify or retrieve information in the data store.
		/// </param>
		/// <param name="thumbs">The thumbnail manager used to retrieve images paths.</param>
		public SeasonApi(ILibraryManager libraryManager,
			IThumbnailsManager thumbs)
			: base(libraryManager.SeasonRepository, thumbs)
		{
			_libraryManager = libraryManager;
		}

		/// <summary>
		/// Get episodes in the season
		/// </summary>
		/// <remarks>
		/// List the episodes that are part of the specified season.
		/// </remarks>
		/// <param name="identifier">The ID or slug of the <see cref="Season"/>.</param>
		/// <param name="sortBy">A key to sort episodes by.</param>
		/// <param name="where">An optional list of filters.</param>
		/// <param name="pagination">The number of episodes to return.</param>
		/// <returns>A page of episodes.</returns>
		/// <response code="400">The filters or the sort parameters are invalid.</response>
		/// <response code="404">No season with the given ID or slug could be found.</response>
		[HttpGet("{identifier:id}/episodes")]
		[HttpGet("{identifier:id}/episode", Order = AlternativeRoute)]
		[PartialPermission(Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<ActionResult<Page<Episode>>> GetEpisode(Identifier identifier,
			[FromQuery] Sort<Episode> sortBy,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] Pagination pagination)
		{
			ICollection<Episode> resources = await _libraryManager.GetAll(
				ApiHelper.ParseWhere(where, identifier.Matcher<Episode>(x => x.SeasonId, x => x.Season!.Slug)),
				sortBy,
				pagination
			);

			if (!resources.Any() && await _libraryManager.GetOrDefault(identifier.IsSame<Season>()) == null)
				return NotFound();
			return Page(resources, pagination.Limit);
		}

		/// <summary>
		/// Get season's show
		/// </summary>
		/// <remarks>
		/// Get the show that this season is part of.
		/// </remarks>
		/// <param name="identifier">The ID or slug of the <see cref="Season"/>.</param>
		/// <returns>The show that contains this season.</returns>
		/// <response code="404">No season with the given ID or slug could be found.</response>
		[HttpGet("{identifier:id}/show")]
		[PartialPermission(Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<ActionResult<Show>> GetShow(Identifier identifier)
		{
			Show? ret = await _libraryManager.GetOrDefault(identifier.IsContainedIn<Show, Season>(x => x.Seasons!));
			if (ret == null)
				return NotFound();
			return ret;
		}
	}
}
