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
	/// Information about one or multiple <see cref="Episode"/>.
	/// </summary>
	[Route("api/episodes")]
	[Route("api/episode", Order = AlternativeRoute)]
	[ApiController]
	[ResourceView]
	[PartialPermission(nameof(EpisodeApi))]
	[ApiDefinition("Episodes", Group = ResourcesGroup)]
	public class EpisodeApi : CrudThumbsApi<Episode>
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
		/// <param name="files">The file manager used to send images.</param>
		/// <param name="thumbnails">The thumbnail manager used to retrieve images paths.</param>
		public EpisodeApi(ILibraryManager libraryManager,
			IFileSystem files,
			IThumbnailsManager thumbnails)
			: base(libraryManager.EpisodeRepository, files, thumbnails)
		{
			_libraryManager = libraryManager;
		}

		/// <summary>
		/// Get episode's show
		/// </summary>
		/// <remarks>
		/// Get the show that this episode is part of.
		/// </remarks>
		/// <param name="identifier">The ID or slug of the <see cref="Episode"/>.</param>
		/// <returns>The show that contains this episode.</returns>
		/// <response code="404">No episode with the given ID or slug could be found.</response>
		[HttpGet("{identifier:id}/show")]
		[PartialPermission(Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<ActionResult<Show>> GetShow(Identifier identifier)
		{
			Show ret = await _libraryManager.GetOrDefault(identifier.IsContainedIn<Show, Episode>(x => x.Episodes));
			if (ret == null)
				return NotFound();
			return ret;
		}

		/// <summary>
		/// Get episode's season
		/// </summary>
		/// <remarks>
		/// Get the season that this episode is part of.
		/// </remarks>
		/// <param name="identifier">The ID or slug of the <see cref="Episode"/>.</param>
		/// <returns>The season that contains this episode.</returns>
		/// <response code="204">The episode is not part of a season.</response>
		/// <response code="404">No episode with the given ID or slug could be found.</response>
		[HttpGet("{identifier:id}/season")]
		[PartialPermission(Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status204NoContent)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<ActionResult<Season>> GetSeason(Identifier identifier)
		{
			Season ret = await _libraryManager.GetOrDefault(identifier.IsContainedIn<Season, Episode>(x => x.Episodes));
			if (ret != null)
				return ret;
			Episode episode = await identifier.Match(
				id => _libraryManager.GetOrDefault<Episode>(id),
				slug => _libraryManager.GetOrDefault<Episode>(slug)
			);
			return episode == null
				? NotFound()
				: NoContent();
		}

		/// <summary>
		/// Get tracks
		/// </summary>
		/// <remarks>
		/// List the tracks (video, audio and subtitles) available for this episode.
		/// This endpoint provide the list of raw tracks, without transcode on it. To get a schema easier to watch
		/// on a player, see the [/watch endpoint](#/watch).
		/// </remarks>
		/// <param name="identifier">The ID or slug of the <see cref="Episode"/>.</param>
		/// <param name="sortBy">A key to sort tracks by.</param>
		/// <param name="where">An optional list of filters.</param>
		/// <param name="limit">The number of tracks to return.</param>
		/// <param name="afterID">An optional track's ID to start the query from this specific item.</param>
		/// <returns>A page of tracks.</returns>
		/// <response code="400">The filters or the sort parameters are invalid.</response>
		/// <response code="404">No episode with the given ID or slug could be found.</response>
		/// TODO fix the /watch endpoint link (when operations ID are specified).
		[HttpGet("{identifier:id}/tracks")]
		[HttpGet("{identifier:id}/track", Order = AlternativeRoute)]
		[PartialPermission(Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<ActionResult<Page<Track>>> GetEpisode(Identifier identifier,
			[FromQuery] string sortBy,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30,
			[FromQuery] int? afterID = null)
		{
			try
			{
				ICollection<Track> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere(where, identifier.Matcher<Track>(x => x.EpisodeID, x => x.Episode.Slug)),
					new Sort<Track>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetOrDefault(identifier.IsSame<Episode>()) == null)
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
