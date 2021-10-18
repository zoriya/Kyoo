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
	/// Retrieve information of an <see cref="Episode"/> as a <see cref="WatchItem"/>.
	/// A watch item is another representation of an episode in a form easier to read and display for playback.
	/// It contains streams (video, audio, subtitles) information, chapters, next and previous episodes and a bit of
	/// information of the show.
	/// </summary>
	[Route("api/watch")]
	[Route("api/watchitem", Order = AlternativeRoute)]
	[ApiController]
	[ApiDefinition("Watch Items", Group = WatchGroup)]
	public class WatchApi : ControllerBase
	{
		/// <summary>
		/// The library manager used to modify or retrieve information in the data store.
		/// </summary>
		private readonly ILibraryManager _libraryManager;

		/// <summary>
		/// Create a new <see cref="WatchApi"/>.
		/// </summary>
		/// <param name="libraryManager">
		/// The library manager used to modify or retrieve information in the data store.
		/// </param>
		public WatchApi(ILibraryManager libraryManager)
		{
			_libraryManager = libraryManager;
		}

		/// <summary>
		/// Get a watch item
		/// </summary>
		/// <remarks>
		/// Retrieve a watch item of an episode.
		/// </remarks>
		/// <param name="identifier">The ID or slug of the <see cref="Episode"/>.</param>
		/// <returns>A page of items.</returns>
		/// <response code="404">No episode with the given ID or slug could be found.</response>
		[HttpGet("{identifier:id}")]
		[Permission("watch", Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<ActionResult<WatchItem>> GetWatchItem(Identifier identifier)
		{
			Episode item = await identifier.Match(
				id => _libraryManager.GetOrDefault<Episode>(id),
				slug => _libraryManager.GetOrDefault<Episode>(slug)
			);
			if (item == null)
				return NotFound();
			return await WatchItem.FromEpisode(item, _libraryManager);
		}
	}
}
