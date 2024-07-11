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
using System.Text;
using System.Threading.Tasks;
using AspNetCore.Proxy;
using AspNetCore.Proxy.Options;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Permissions;
using Kyoo.Abstractions.Models.Utils;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;

namespace Kyoo.Core.Api;

public abstract class TranscoderApi<T>(IRepository<T> repository) : CrudThumbsApi<T>(repository)
	where T : class, IResource, IThumbnails, IQuery
{
	private Task _Proxy(string route)
	{
		HttpProxyOptions proxyOptions = HttpProxyOptionsBuilder
			.Instance.WithHandleFailure(
				async (context, exception) =>
				{
					context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
					await context.Response.WriteAsJsonAsync(
						new RequestError("Service unavailable")
					);
				}
			)
			.Build();
		return this.HttpProxyAsync($"{VideoApi.TranscoderUrl}/{route}", proxyOptions);
	}

	protected abstract Task<string> GetPath(Identifier identifier);

	private async Task<string> _GetPath64(Identifier identifier)
	{
		string path = await GetPath(identifier);
		return WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(path));
	}

	/// <summary>
	/// Direct stream
	/// </summary>
	/// <remarks>
	/// Retrieve the raw video stream, in the same container as the one on the server. No transcoding or
	/// transmuxing is done.
	/// </remarks>
	/// <param name="identifier">The ID or slug of the <see cref="Episode"/>.</param>
	/// <returns>The video file of this episode.</returns>
	/// <response code="404">No episode with the given ID or slug could be found.</response>
	[HttpGet("{identifier:id}/direct")]
	[PartialPermission(Kind.Play)]
	[ProducesResponseType(StatusCodes.Status302Found)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	public async Task<IActionResult> GetDirectStream(Identifier identifier)
	{
		// TODO: Remove the /api and use a proxy rewrite instead.
		return Redirect($"/api/video/{await _GetPath64(identifier)}/direct");
	}

	/// <summary>
	/// Get master playlist
	/// </summary>
	/// <remarks>
	/// Get a master playlist containing all possible video qualities and audios available for this resource.
	/// Note that the direct stream is missing (since the direct is not an hls stream) and
	/// subtitles/fonts are not included to support more codecs than just webvtt.
	/// </remarks>
	/// <param name="identifier">The ID or slug of the <see cref="Episode"/>.</param>
	/// <returns>The master playlist of this episode.</returns>
	/// <response code="404">No episode with the given ID or slug could be found.</response>
	[HttpGet("{identifier:id}/master.m3u8")]
	[PartialPermission(Kind.Play)]
	[ProducesResponseType(StatusCodes.Status302Found)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	public async Task<IActionResult> GetMaster(Identifier identifier)
	{
		// TODO: Remove the /api and use a proxy rewrite instead.
		return Redirect($"/api/video/{await _GetPath64(identifier)}/master.m3u8");
	}

	/// <summary>
	/// Get file info
	/// </summary>
	/// <remarks>
	/// Identify metadata about a file.
	/// </remarks>
	/// <param name="identifier">The ID or slug of the <see cref="Episode"/>.</param>
	/// <returns>The media infos of the file.</returns>
	/// <response code="404">No episode with the given ID or slug could be found.</response>
	[HttpGet("{identifier:id}/info")]
	[PartialPermission(Kind.Read)]
	public async Task GetInfo(Identifier identifier)
	{
		await _Proxy($"{await _GetPath64(identifier)}/info");
	}

	/// <summary>
	/// Get thumbnail sprite
	/// </summary>
	/// <remarks>
	/// Get a sprite file containing all the thumbnails of the show.
	/// </remarks>
	/// <param name="identifier">The ID or slug of the <see cref="Episode"/>.</param>
	/// <returns>A sprite with an image for every X seconds of the video file.</returns>
	/// <response code="404">No episode with the given ID or slug could be found.</response>
	[HttpGet("{identifier:id}/thumbnails.png")]
	[PartialPermission(Kind.Read)]
	public async Task GetThumbnails(Identifier identifier)
	{
		await _Proxy($"{await _GetPath64(identifier)}/thumbnails.png");
	}

	/// <summary>
	/// Get thumbnail vtt
	/// </summary>
	/// <remarks>
	/// Get a vtt file containing timing/position of thumbnails inside the sprite file.
	/// https://developer.bitmovin.com/playback/docs/webvtt-based-thumbnails for more info.
	/// </remarks>
	/// <param name="identifier">The ID or slug of the <see cref="Episode"/>.</param>
	/// <returns>A vtt file containing metadata about timing and x/y/width/height of the sprites of /thumbnails.png.</returns>
	/// <response code="404">No episode with the given ID or slug could be found.</response>
	[HttpGet("{identifier:id}/thumbnails.vtt")]
	[PartialPermission(Kind.Read)]
	public async Task GetThumbnailsVtt(Identifier identifier)
	{
		await _Proxy($"{await _GetPath64(identifier)}/thumbnails.vtt");
	}
}
