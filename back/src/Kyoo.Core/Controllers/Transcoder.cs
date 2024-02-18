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
using Kyoo.Abstractions.Models.Utils;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Core.Controllers;

public class Transcoder : Controller
{
	public Task Proxy(string route, string path)
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
}
