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
	/// Information about one or multiple <see cref="Track"/>.
	/// A track contain metadata about a video, an audio or a subtitles.
	/// </summary>
	[Route("tracks")]
	[Route("track", Order = AlternativeRoute)]
	[ApiController]
	[ResourceView]
	[PartialPermission(nameof(Track))]
	[ApiDefinition("Tracks", Group = WatchGroup)]
	public class TrackApi : CrudApi<Track>
	{
		/// <summary>
		/// The library manager used to modify or retrieve information in the data store.
		/// </summary>
		private readonly ILibraryManager _libraryManager;

		/// <summary>
		/// Create a new <see cref="TrackApi"/>.
		/// </summary>
		/// <param name="libraryManager">
		/// The library manager used to modify or retrieve information in the data store.
		/// </param>
		public TrackApi(ILibraryManager libraryManager)
			: base(libraryManager.TrackRepository)
		{
			_libraryManager = libraryManager;
		}

		/// <summary>
		/// Get track's episode
		/// </summary>
		/// <remarks>
		/// Get the episode that uses this track.
		/// </remarks>
		/// <param name="identifier">The ID or slug of the <see cref="Track"/>.</param>
		/// <returns>The episode that uses this track.</returns>
		/// <response code="404">No track with the given ID or slug could be found.</response>
		[HttpGet("{identifier:id}/episode")]
		[PartialPermission(Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<ActionResult<Episode>> GetEpisode(Identifier identifier)
		{
			return await _libraryManager.Get(identifier.IsContainedIn<Episode, Track>(x => x.Tracks));
		}
	}
}
