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

using System.Linq;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Exceptions;
using Kyoo.Abstractions.Models.Permissions;
using Kyoo.Core.Models.Options;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Kyoo.Core.Api
{
	[Route("api/track")]
	[Route("api/tracks")]
	[ApiController]
	[PartialPermission(nameof(Track))]
	public class TrackApi : CrudApi<Track>
	{
		private readonly ILibraryManager _libraryManager;

		public TrackApi(ILibraryManager libraryManager, IOptions<BasicOptions> options)
			: base(libraryManager.TrackRepository, options.Value.PublicUrl)
		{
			_libraryManager = libraryManager;
		}

		[HttpGet("{id:int}/episode")]
		[PartialPermission(Kind.Read)]
		public async Task<ActionResult<Episode>> GetEpisode(int id)
		{
			try
			{
				return await _libraryManager.Get<Episode>(x => x.Tracks.Any(y => y.ID == id));
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
		}

		[HttpGet("{slug}/episode")]
		[PartialPermission(Kind.Read)]
		public async Task<ActionResult<Episode>> GetEpisode(string slug)
		{
			try
			{
				return await _libraryManager.Get<Episode>(x => x.Tracks.Any(y => y.Slug == slug));
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
		}
	}
}
