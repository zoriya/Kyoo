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
using Kyoo.Abstractions.Models.Permissions;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Core.Api
{
	/// <summary>
	/// Proxy to other services
	/// </summary>
	[ApiController]
	public class ProxyApi : Controller
	{
		/// <summary>
		/// Transcoder proxy
		/// </summary>
		/// <remarks>
		/// Simply proxy requests to the transcoder
		/// </remarks>
		/// <param name="rest">The path of the transcoder.</param>
		/// <returns>The return value of the transcoder.</returns>
		[Route("video/{**rest}")]
		[Permission("video", Kind.Read)]
		public Task Proxy(string rest)
		{
			// TODO: Use an env var to configure transcoder:7666.
			return this.HttpProxyAsync($"http://transcoder:7666/{rest}");
		}
	}
}
