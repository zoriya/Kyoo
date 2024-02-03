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
using System.IO;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Abstractions.Models.Permissions;
using Kyoo.Abstractions.Models.Utils;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using static Kyoo.Abstractions.Models.Utils.Constants;

namespace Kyoo.Core.Api;

/// <summary>
/// Information about one or multiple <see cref="User"/>.
/// </summary>
[Route("users")]
[Route("user", Order = AlternativeRoute)]
[ApiController]
[PartialPermission(nameof(User), Group = Group.Admin)]
[ApiDefinition("Users", Group = ResourcesGroup)]
public class UserApi(ILibraryManager libraryManager, IThumbnailsManager thumbs)
	: CrudApi<User>(libraryManager.Users)
{
	/// <summary>
	/// Get profile picture
	/// </summary>
	/// <remarks>
	/// Get the profile picture of someone
	/// </remarks>
	[HttpGet("{identifier:id}/logo")]
	[PartialPermission(Kind.Read)]
	[ProducesResponseType(StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status401Unauthorized, Type = typeof(RequestError))]
	[ProducesResponseType(StatusCodes.Status403Forbidden, Type = typeof(RequestError))]
	public async Task<ActionResult> GetProfilePicture(Identifier identifier)
	{
		Guid gid = await identifier.Match(
			id => Task.FromResult(id),
			async slug => (await libraryManager.Users.Get(slug)).Id
		);
		Stream img = await thumbs.GetUserImage(gid);
		if (identifier.Is("random"))
			Response.Headers.Add("Cache-Control", $"public, no-store");
		else
		{
			// Allow clients to cache the image for 6 month.
			Response.Headers.Add("Cache-Control", $"public, max-age={60 * 60 * 24 * 31 * 6}");
		}
		return File(img, "image/webp", true);
	}
}

