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
		/// The file manager used to send images.
		/// </summary>
		private readonly IFileSystem _files;

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
		/// <param name="files">The file manager used to send images.</param>
		/// <param name="thumbs">The thumbnail manager used to retrieve images paths.</param>
		public CrudThumbsApi(IRepository<T> repository,
			IFileSystem files,
			IThumbnailsManager thumbs)
			: base(repository)
		{
			_files = files;
			_thumbs = thumbs;
		}

		/// <summary>
		/// Get image
		/// </summary>
		/// <remarks>
		/// Get an image for the specified item.
		/// List of commonly available images:<br/>
		///  - Poster: Image 0, also available at /poster<br/>
		///  - Thumbnail: Image 1, also available at /thumbnail<br/>
		///  - Logo: Image 3, also available at /logo<br/>
		/// <br/>
		/// Other images can be arbitrarily added by plugins so any image number can be specified from this endpoint.
		/// </remarks>
		/// <param name="identifier">The ID or slug of the resource to get the image for.</param>
		/// <param name="image">The number of the image to retrieve.</param>
		/// <returns>The image asked.</returns>
		/// <response code="404">No item exist with the specific identifier or the image does not exists on kyoo.</response>
		[HttpGet("{identifier:id}/image-{image:int}")]
		[PartialPermission(Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<IActionResult> GetImage(Identifier identifier, int image)
		{
			T resource = await identifier.Match(
				id => Repository.GetOrDefault(id),
				slug => Repository.GetOrDefault(slug)
			);
			if (resource == null)
				return NotFound();
			string path = await _thumbs.GetImagePath(resource, image);
			return _files.FileResult(path);
		}

		/// <summary>
		/// Get Poster
		/// </summary>
		/// <remarks>
		/// Get the poster for the specified item.
		/// </remarks>
		/// <param name="identifier">The ID or slug of the resource to get the image for.</param>
		/// <returns>The image asked.</returns>
		/// <response code="404">
		/// No item exist with the specific identifier or the image does not exists on kyoo.
		/// </response>
		[HttpGet("{identifier:id}/poster", Order = AlternativeRoute)]
		[PartialPermission(Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public Task<IActionResult> GetPoster(Identifier identifier)
		{
			return GetImage(identifier, Images.Poster);
		}

		/// <summary>
		/// Get Logo
		/// </summary>
		/// <remarks>
		/// Get the logo for the specified item.
		/// </remarks>
		/// <param name="identifier">The ID or slug of the resource to get the image for.</param>
		/// <returns>The image asked.</returns>
		/// <response code="404">
		/// No item exist with the specific identifier or the image does not exists on kyoo.
		/// </response>
		[HttpGet("{identifier:id}/logo", Order = AlternativeRoute)]
		[PartialPermission(Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public Task<IActionResult> GetLogo(Identifier identifier)
		{
			return GetImage(identifier, Images.Logo);
		}

		/// <summary>
		/// Get Thumbnail
		/// </summary>
		/// <remarks>
		/// Get the thumbnail for the specified item.
		/// </remarks>
		/// <param name="identifier">The ID or slug of the resource to get the image for.</param>
		/// <returns>The image asked.</returns>
		/// <response code="404">
		/// No item exist with the specific identifier or the image does not exists on kyoo.
		/// </response>
		[HttpGet("{identifier:id}/backdrop", Order = AlternativeRoute)]
		[HttpGet("{identifier:id}/thumbnail", Order = AlternativeRoute)]
		public Task<IActionResult> GetBackdrop(Identifier identifier)
		{
			return GetImage(identifier, Images.Thumbnail);
		}
	}
}
