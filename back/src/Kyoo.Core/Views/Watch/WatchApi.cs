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
	[Route("watch")]
	[Route("watchitem", Order = AlternativeRoute)]
	[ApiController]
	[ApiDefinition("Watch Items", Group = WatchGroup)]
	public class WatchApi : ControllerBase
	{
		/// <summary>
		/// The library manager used to modify or retrieve information in the data store.
		/// </summary>
		private readonly ILibraryManager _libraryManager;

		/// <summary>
		/// A file system used to retrieve chapters informations.
		/// </summary>
		private readonly IFileSystem _files;

		/// <summary>
		/// The transcoder used to list fonts.
		/// </summary>
		private readonly ITranscoder _transcoder;

		/// <summary>
		/// Create a new <see cref="WatchApi"/>.
		/// </summary>
		/// <param name="libraryManager">
		/// The library manager used to modify or retrieve information in the data store.
		/// </param>
		/// <param name="fs">A file system used to retrieve chapters informations.</param>
		/// <param name="transcoder">The transcoder used to list fonts.</param>
		public WatchApi(ILibraryManager libraryManager, IFileSystem fs, ITranscoder transcoder)
		{
			_libraryManager = libraryManager;
			_files = fs;
			_transcoder = transcoder;
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
			return await WatchItem.FromEpisode(item, _libraryManager, _files, _transcoder);
		}

		/// <summary>
		/// Get font
		/// </summary>
		/// <remarks>
		/// Get a font file that is used in subtitles of this episode.
		/// </remarks>
		/// <param name="identifier">The ID or slug of the <see cref="Episode"/>.</param>
		/// <param name="slug">The slug of the font to retrieve.</param>
		/// <returns>A page of collections.</returns>
		/// <response code="404">No show with the given ID/slug could be found or the font does not exist.</response>
		[HttpGet("{identifier:id}/fonts/{slug}")]
		[HttpGet("{identifier:id}/font/{slug}", Order = AlternativeRoute)]
		[PartialPermission(Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<IActionResult> GetFont(Identifier identifier, string slug)
		{
			Episode episode = await identifier.Match(
				id => _libraryManager.GetOrDefault<Episode>(id),
				slug => _libraryManager.GetOrDefault<Episode>(slug)
			);
			if (episode == null)
				return NotFound();
			if (slug.Contains('.'))
				slug = slug[..slug.LastIndexOf('.')];
			Font font = await _transcoder.GetFont(episode, slug);
			if (font == null)
				return NotFound();
			return _files.FileResult(font.Path);
		}
	}
}
