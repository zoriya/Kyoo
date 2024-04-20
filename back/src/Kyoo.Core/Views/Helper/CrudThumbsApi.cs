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
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Permissions;
using Kyoo.Abstractions.Models.Utils;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using static Kyoo.Abstractions.Models.Utils.Constants;

namespace Kyoo.Core.Api;

[ApiController]
public class CrudThumbsApi<T>(IRepository<T> repository) : CrudApi<T>(repository)
	where T : class, IResource, IThumbnails, IQuery
{
	private async Task<IActionResult> _GetImage(
		Identifier identifier,
		string image,
		ImageQuality? quality
	)
	{
		T? resource = await identifier.Match(
			id => Repository.GetOrDefault(id),
			slug => Repository.GetOrDefault(slug)
		);
		if (resource == null)
			return NotFound();

		Image? img = image switch
		{
			"poster" => resource.Poster,
			"thumbnail" => resource.Thumbnail,
			"logo" => resource.Logo,
			_ => throw new ArgumentException(nameof(image)),
		};
		if (img is null)
			return NotFound();

		return Redirect($"/thumbnails/{img.Id}");
	}

	/// <summary>
	/// Get Poster
	/// </summary>
	/// <remarks>
	/// Get the poster for the specified item.
	/// </remarks>
	/// <param name="identifier">The ID or slug of the resource to get the image for.</param>
	/// <param name="quality">The quality of the image to retrieve.</param>
	/// <returns>The image asked.</returns>
	/// <response code="404">
	/// No item exist with the specific identifier or the image does not exists on kyoo.
	/// </response>
	[HttpGet("{identifier:id}/poster")]
	[PartialPermission(Kind.Read)]
	[ProducesResponseType(StatusCodes.Status302Found)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	public Task<IActionResult> GetPoster(Identifier identifier, [FromQuery] ImageQuality? quality)
	{
		return _GetImage(identifier, "poster", quality);
	}

	/// <summary>
	/// Get Logo
	/// </summary>
	/// <remarks>
	/// Get the logo for the specified item.
	/// </remarks>
	/// <param name="identifier">The ID or slug of the resource to get the image for.</param>
	/// <param name="quality">The quality of the image to retrieve.</param>
	/// <returns>The image asked.</returns>
	/// <response code="404">
	/// No item exist with the specific identifier or the image does not exists on kyoo.
	/// </response>
	[HttpGet("{identifier:id}/logo")]
	[PartialPermission(Kind.Read)]
	[ProducesResponseType(StatusCodes.Status302Found)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	public Task<IActionResult> GetLogo(Identifier identifier, [FromQuery] ImageQuality? quality)
	{
		return _GetImage(identifier, "logo", quality);
	}

	/// <summary>
	/// Get Thumbnail
	/// </summary>
	/// <remarks>
	/// Get the thumbnail for the specified item.
	/// </remarks>
	/// <param name="identifier">The ID or slug of the resource to get the image for.</param>
	/// <param name="quality">The quality of the image to retrieve.</param>
	/// <returns>The image asked.</returns>
	/// <response code="404">
	/// No item exist with the specific identifier or the image does not exists on kyoo.
	/// </response>
	[HttpGet("{identifier:id}/thumbnail")]
	[HttpGet("{identifier:id}/backdrop", Order = AlternativeRoute)]
	[ProducesResponseType(StatusCodes.Status302Found)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	public Task<IActionResult> GetBackdrop(Identifier identifier, [FromQuery] ImageQuality? quality)
	{
		return _GetImage(identifier, "thumbnail", quality);
	}
}
