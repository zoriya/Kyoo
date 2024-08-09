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
using System.Threading.Tasks;
using AspNetCore.Proxy;
using AspNetCore.Proxy.Options;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Abstractions.Models.Permissions;
using Kyoo.Abstractions.Models.Utils;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using static Kyoo.Abstractions.Models.Utils.Constants;

namespace Kyoo.Core.Api;

/// <summary>
/// Private routes of the transcoder.
/// Url for these routes will be returned from /info or /master.m3u8 routes.
/// This should not be called manually
/// </summary>
[ApiController]
[Route("videos")]
[Route("video", Order = AlternativeRoute)]
[Permission("video", Kind.Read, Group = Group.Overall)]
[ApiDefinition("Video", Group = OtherGroup)]
public class VideoApi : Controller
{
	public static string TranscoderUrl =
		Environment.GetEnvironmentVariable("TRANSCODER_URL") ?? "http://transcoder:7666";

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
		return this.HttpProxyAsync($"{TranscoderUrl}/{route}", proxyOptions);
	}

	[HttpGet("{path:base64}/direct")]
	[PartialPermission(Kind.Play)]
	[ProducesResponseType(StatusCodes.Status206PartialContent)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	public async Task GetDirectStream(string path)
	{
		await _Proxy($"{path}/direct");
	}

	[HttpGet("{path:base64}/direct/{identifier}")]
	[PartialPermission(Kind.Play)]
	[ProducesResponseType(StatusCodes.Status206PartialContent)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	public async Task GetDirectStream(string path, string identifier)
	{
		await _Proxy($"{path}/direct/{identifier}");
	}

	[HttpGet("{path:base64}/master.m3u8")]
	[PartialPermission(Kind.Play)]
	[ProducesResponseType(StatusCodes.Status206PartialContent)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	public async Task GetMaster(string path)
	{
		await _Proxy($"{path}/master.m3u8");
	}

	[HttpGet("{path:base64}/{video:int}/{quality}/index.m3u8")]
	[PartialPermission(Kind.Play)]
	public async Task GetVideoIndex(string path, int video, string quality)
	{
		await _Proxy($"{path}/{video}/{quality}/index.m3u8");
	}

	[HttpGet("{path:base64}/{video:int}/{quality}/{segment}")]
	[PartialPermission(Kind.Play)]
	public async Task GetVideoSegment(string path, int video, string quality, string segment)
	{
		await _Proxy($"{path}/{video}/{quality}/{segment}");
	}

	[HttpGet("{path:base64}/audio/{audio}/index.m3u8")]
	[PartialPermission(Kind.Play)]
	public async Task GetAudioIndex(string path, string audio)
	{
		await _Proxy($"{path}/audio/{audio}/index.m3u8");
	}

	[HttpGet("{path:base64}/audio/{audio}/{segment}")]
	[PartialPermission(Kind.Play)]
	public async Task GetAudioSegment(string path, string audio, string segment)
	{
		await _Proxy($"{path}/audio/{audio}/{segment}");
	}

	[HttpGet("{path:base64}/attachment/{name}")]
	[PartialPermission(Kind.Play)]
	public async Task GetAttachment(string path, string name)
	{
		await _Proxy($"{path}/attachment/{name}");
	}

	[HttpGet("{path:base64}/subtitle/{name}")]
	[PartialPermission(Kind.Play)]
	public async Task GetSubtitle(string path, string name)
	{
		await _Proxy($"{path}/subtitle/{name}");
	}

	[HttpGet("{path:base64}/thumbnails.png")]
	[PartialPermission(Kind.Read)]
	public async Task GetThumbnails(string path)
	{
		await _Proxy($"{path}/thumbnails.png");
	}

	[HttpGet("{path:base64}/thumbnails.vtt")]
	[PartialPermission(Kind.Read)]
	public async Task GetThumbnailsVtt(string path)
	{
		await _Proxy($"{path}/thumbnails.vtt");
	}
}
