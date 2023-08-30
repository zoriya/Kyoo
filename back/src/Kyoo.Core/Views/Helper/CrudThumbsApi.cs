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

using System.IO;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Permissions;
using Kyoo.Abstractions.Models.Utils;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using static Kyoo.Abstractions.Models.Utils.Constants;

namespace Kyoo.Core.Api
{
	/// <summary>
	/// A base class to handle CRUD operations and services thumbnails for
	/// a specific resource type <typeparamref name="T"/>.
	/// </summary>
	/// <typeparam name="T">The type of resource to make CRUD and thumbnails apis for.</typeparam>
	[ApiController]
	[ResourceView]
	public class CrudThumbsApi<T> : CrudApi<T>
		where T : class, IResource, IThumbnails
	{
		/// <summary>
		/// The thumbnail manager used to retrieve images paths.
		/// </summary>
		private readonly IThumbnailsManager _thumbs;

		/// <summary>
		/// Create a new <see cref="CrudThumbsApi{T}"/> that handles crud requests and thumbnails.
		/// </summary>
		/// <param name="repository">
		/// The repository to use as a baking store for the type <typeparamref name="T"/>.
		/// </param>
		/// <param name="thumbs">The thumbnail manager used to retrieve images paths.</param>
		public CrudThumbsApi(IRepository<T> repository,
			IThumbnailsManager thumbs)
			: base(repository)
		{
			_thumbs = thumbs;
		}

		private async Task<IActionResult> _GetImage(Identifier identifier, string image, ImageQuality? quality)
		{
			T resource = await identifier.Match(
				id => Repository.GetOrDefault(id),
				slug => Repository.GetOrDefault(slug)
			);
			if (resource == null)
				return NotFound();
			string path = _thumbs.GetImagePath(resource, image, quality ?? ImageQuality.High);
			if (path == null || !System.IO.File.Exists(path))
				return NotFound();
			return PhysicalFile(Path.GetFullPath(path), "image/webp", true);
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
		[ProducesResponseType(StatusCodes.Status200OK)]
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
		[ProducesResponseType(StatusCodes.Status200OK)]
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
		public Task<IActionResult> GetBackdrop(Identifier identifier, [FromQuery] ImageQuality? quality)
		{
			return _GetImage(identifier, "thumbnail", quality);
		}

		/// <inheritdoc/>
		public override async Task<ActionResult<T>> Create([FromBody] T resource)
		{
			await _thumbs.DownloadImages(resource);
			return await base.Create(resource);
		}
	}
}
