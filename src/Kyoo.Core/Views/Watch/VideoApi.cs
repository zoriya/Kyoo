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

using System.IO;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Abstractions.Models.Permissions;
using Kyoo.Abstractions.Models.Utils;
using Kyoo.Core.Models.Options;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;
using static Kyoo.Abstractions.Models.Utils.Constants;

namespace Kyoo.Core.Api
{
	/// <summary>
	/// Get the video in a raw format or transcoded in the codec you want.
	/// </summary>
	[Route("videos")]
	[Route("video", Order = AlternativeRoute)]
	[ApiController]
	[ApiDefinition("Videos", Group = WatchGroup)]
	public class VideoApi : Controller
	{
		/// <summary>
		/// The library manager used to modify or retrieve information in the data store.
		/// </summary>
		private readonly ILibraryManager _libraryManager;

		/// <summary>
		/// The file system used to send video files.
		/// </summary>
		private readonly IFileSystem _files;

		/// <summary>
		/// Create a new <see cref="VideoApi"/>.
		/// </summary>
		/// <param name="libraryManager">The library manager used to retrieve episodes.</param>
		/// <param name="files">The file manager used to send video files.</param>
		public VideoApi(ILibraryManager libraryManager,
			IFileSystem files)
		{
			_libraryManager = libraryManager;
			_files = files;
		}

		/// <inheritdoc />
		/// <remarks>
		/// Disabling the cache prevent an issue on firefox that skip the last 30 seconds of HLS files
		/// </remarks>
		public override void OnActionExecuted(ActionExecutedContext ctx)
		{
			base.OnActionExecuted(ctx);
			ctx.HttpContext.Response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate");
			ctx.HttpContext.Response.Headers.Add("Pragma", "no-cache");
			ctx.HttpContext.Response.Headers.Add("Expires", "0");
		}

		/// <summary>
		/// Direct video
		/// </summary>
		/// <remarks>
		/// Retrieve the raw video stream, in the same container as the one on the server. No transcoding or
		/// transmuxing is done.
		/// </remarks>
		/// <param name="identifier">The identifier of the episode to retrieve.</param>
		/// <returns>The raw video stream</returns>
		/// <response code="404">No episode exists for the given identifier.</response>
		// TODO enable the following line, this is disabled since the web app can't use bearers. [Permission("video", Kind.Read)]
		[HttpGet("direct/{identifier:id}")]
		[HttpGet("{identifier:id}", Order = AlternativeRoute)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<IActionResult> Direct(Identifier identifier)
		{
			Episode episode = await identifier.Match(
				id => _libraryManager.GetOrDefault<Episode>(id),
				slug => _libraryManager.GetOrDefault<Episode>(slug)
			);
			return _files.FileResult(episode?.Path, true);
		}

		/// <summary>
		/// Transmux video
		/// </summary>
		/// <remarks>
		/// Change the container of the video to hls but don't re-encode the video or audio. This doesn't require mutch
		/// resources from the server.
		/// </remarks>
		/// <param name="identifier">The identifier of the episode to retrieve.</param>
		/// <returns>The transmuxed video stream</returns>
		/// <response code="404">No episode exists for the given identifier.</response>
		[HttpGet("transmux/{identifier:id}/master.m3u8")]
		[Permission("video", Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<IActionResult> Transmux(Identifier identifier)
		{
			Episode episode = await identifier.Match(
				id => _libraryManager.GetOrDefault<Episode>(id),
				slug => _libraryManager.GetOrDefault<Episode>(slug)
			);
			return _files.Transmux(episode);
		}

		/// <summary>
		/// Transmuxed chunk
		/// </summary>
		/// <remarks>
		/// Retrieve a chunk of a transmuxed video.
		/// </remarks>
		/// <param name="episodeLink">The identifier of the episode.</param>
		/// <param name="chunk">The identifier of the chunk to retrieve.</param>
		/// <param name="options">The options used to retrieve the path of the segments.</param>
		/// <returns>A transmuxed video chunk.</returns>
		[HttpGet("transmux/{episodeLink}/segments/{chunk}", Order = AlternativeRoute)]
		[Permission("video", Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		public IActionResult GetTransmuxedChunk(string episodeLink, string chunk,
			[FromServices] IOptions<BasicOptions> options)
		{
			string path = Path.GetFullPath(Path.Combine(options.Value.TransmuxPath, episodeLink));
			path = Path.Combine(path, "segments", chunk);
			return PhysicalFile(path, "video/MP2T");
		}
	}
}
