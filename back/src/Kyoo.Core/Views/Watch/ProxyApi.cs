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
using System.Collections.Generic;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models.Permissions;
using Kyoo.Abstractions.Models.Utils;
using Kyoo.Core.Controllers;
using Kyoo.Utils;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Core.Api
{
	/// <summary>
	/// Proxy to other services
	/// </summary>
	[ApiController]
	[Obsolete("Use /episode/id/master.m3u8 or routes like that")]
	public class ProxyApi(ILibraryManager library, Transcoder transcoder) : Controller
	{
		/// <summary>
		/// Transcoder proxy
		/// </summary>
		/// <remarks>
		/// Simply proxy requests to the transcoder
		/// </remarks>
		/// <param name="rest">The path of the transcoder.</param>
		/// <returns>The return value of the transcoder.</returns>
		[Route("video/{type}/{id:id}/{**rest}")]
		[Permission("video", Kind.Read)]
		[Obsolete("Use /episode/id/master.m3u8 or routes like that")]
		public async Task Proxy(
			string type,
			Identifier id,
			string rest,
			[FromQuery] Dictionary<string, string> query
		)
		{
			string path = await (
				type is "movie" or "movies"
					? id.Match(
						async id => (await library.Movies.Get(id)).Path,
						async slug => (await library.Movies.Get(slug)).Path
					)
					: id.Match(
						async id => (await library.Episodes.Get(id)).Path,
						async slug => (await library.Episodes.Get(slug)).Path
					)
			);
			await transcoder.Proxy(rest + query.ToQueryString(), path);
		}
	}
}
