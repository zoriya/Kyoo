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
using AspNetCore.Proxy;
using AspNetCore.Proxy.Options;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Permissions;
using Kyoo.Abstractions.Models.Utils;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Core.Api;

public abstract class TranscoderApi<T>(IRepository<T> repository, IThumbnailsManager thumbs)
	: CrudThumbsApi<T>(repository, thumbs)
	where T : class, IResource, IThumbnails, IQuery
{
	private Task _Proxy(string route, string path)
	{
		HttpProxyOptions proxyOptions = HttpProxyOptionsBuilder
			.Instance.WithBeforeSend(
				(ctx, req) =>
				{
					req.Headers.Add("X-Path", path);
					return Task.CompletedTask;
				}
			)
			.WithHandleFailure(
				async (context, exception) =>
				{
					context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
					await context.Response.WriteAsJsonAsync(
						new RequestError("Service unavailable")
					);
				}
			)
			.Build();
		return this.HttpProxyAsync($"http://transcoder:7666/{route}", proxyOptions);
	}

	protected abstract Task<string> GetPath(Identifier identifier);

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
	[ProducesResponseType(StatusCodes.Status206PartialContent)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	public async Task GetDirectStream(Identifier identifier)
	{
		await _Proxy("/direct", await GetPath(identifier));
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
	[ProducesResponseType(StatusCodes.Status206PartialContent)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	public async Task GetMaster(Identifier identifier)
	{
		await _Proxy("/master.m3u8", await GetPath(identifier));
	}

	[HttpGet("{identifier:id}/{quality}/index.m3u8")]
	[PartialPermission(Kind.Play)]
	public async Task GetVideoIndex(Identifier identifier, string quality)
	{
		await _Proxy($"/{quality}/index.m3u8", await GetPath(identifier));
	}

	[HttpGet("{identifier:id}/audio/{audio}/index.m3u8")]
	[PartialPermission(Kind.Play)]
	public async Task GetAudioIndex(Identifier identifier, string audio)
	{
		await _Proxy($"/audio/{audio}/index.m3u8", await GetPath(identifier));
	}

	[HttpGet("{identifier:id}/audio/{audio}/{segment}")]
	[PartialPermission(Kind.Play)]
	public async Task GetAudioSegment(Identifier identifier, string audio, string segment)
	{
		await _Proxy($"/audio/{audio}/{segment}", await GetPath(identifier));
	}

	[HttpGet("{identifier:id}/info")]
	[PartialPermission(Kind.Play)]
	public async Task GetInfo(Identifier identifier)
	{
		await _Proxy("/info", await GetPath(identifier));
	}
}
