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
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using static Kyoo.Abstractions.Models.Utils.Constants;

namespace Kyoo.Core.Api;

/// <summary>
/// Retrive images.
/// </summary>
[ApiController]
[Route("thumbnails")]
[Route("images", Order = AlternativeRoute)]
[Route("image", Order = AlternativeRoute)]
[Permission(nameof(Image), Kind.Read, Group = Group.Overall)]
[ApiDefinition("Images", Group = OtherGroup)]
public class ThumbnailsApi(IThumbnailsManager thumbs) : BaseApi
{
	/// <summary>
	/// Get Image
	/// </summary>
	/// <remarks>
	/// Get an image from it's id. You can select a specefic quality.
	/// </remarks>
	/// <param name="id">The ID of the image to retrive.</param>
	/// <param name="quality">The quality of the image to retrieve.</param>
	/// <returns>The image asked.</returns>
	/// <response code="404">
	/// The image does not exists on kyoo.
	/// </response>
	[HttpGet("{id:guid}")]
	[ProducesResponseType(StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	public async Task<IActionResult> GetPoster(Guid id, [FromQuery] ImageQuality? quality)
	{
		quality ??= ImageQuality.High;
		if (!await thumbs.IsImageSaved(id, quality.Value))
			return NotFound();

		// Allow clients to cache the image for 6 month.
		Response.Headers.CacheControl = $"public, max-age={60 * 60 * 24 * 31 * 6}";
		return File(await thumbs.GetImage(id, quality.Value), "image/webp", true);
	}
}
