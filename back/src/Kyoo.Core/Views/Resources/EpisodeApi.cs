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
	[Route("episodes")]
	[Route("episode", Order = AlternativeRoute)]
	[ApiController]
	[ResourceView]
	[PartialPermission(nameof(Episode))]
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
		/// <param name="thumbnails">The thumbnail manager used to retrieve images paths.</param>
		public EpisodeApi(ILibraryManager libraryManager,
			IThumbnailsManager thumbnails)
			: base(libraryManager.Episodes, thumbnails)
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
		/// <param name="fields">The aditional fields to include in the result.</param>
		/// <returns>The show that contains this episode.</returns>
		/// <response code="404">No episode with the given ID or slug could be found.</response>
		[HttpGet("{identifier:id}/show")]
		[PartialPermission(Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<ActionResult<Show>> GetShow(Identifier identifier, [FromQuery] Include<Show> fields)
		{
			return await _libraryManager.Shows.Get(identifier.IsContainedIn<Show, Episode>(x => x.Episodes!), fields);
		}

		/// <summary>
		/// Get episode's season
		/// </summary>
		/// <remarks>
		/// Get the season that this episode is part of.
		/// </remarks>
		/// <param name="identifier">The ID or slug of the <see cref="Episode"/>.</param>
		/// <param name="fields">The aditional fields to include in the result.</param>
		/// <returns>The season that contains this episode.</returns>
		/// <response code="204">The episode is not part of a season.</response>
		/// <response code="404">No episode with the given ID or slug could be found.</response>
		[HttpGet("{identifier:id}/season")]
		[PartialPermission(Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status204NoContent)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<ActionResult<Season>> GetSeason(Identifier identifier, [FromQuery] Include<Season> fields)
		{
			Season? ret = await _libraryManager.Seasons.GetOrDefault(
				identifier.IsContainedIn<Season, Episode>(x => x.Episodes!),
				fields
			);
			if (ret != null)
				return ret;
			Episode? episode = await identifier.Match(
				id => _libraryManager.Episodes.GetOrDefault(id),
				slug => _libraryManager.Episodes.GetOrDefault(slug)
			);
			return episode == null
				? NotFound()
				: NoContent();
		}
	}
}
