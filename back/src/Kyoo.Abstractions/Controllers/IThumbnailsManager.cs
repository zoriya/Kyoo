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
using Kyoo.Abstractions.Models;

namespace Kyoo.Abstractions.Controllers;

/// <summary>
/// Download images and retrieve the path of those images for a resource.
/// </summary>
public interface IThumbnailsManager
{
	/// <summary>
	/// Download images of a specified item.
	/// If no images is available to download, do nothing and silently return.
	/// </summary>
	/// <param name="item">
	/// The item to cache images.
	/// </param>
	/// <typeparam name="T">The type of the item</typeparam>
	/// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
	Task DownloadImages<T>(T item)
		where T : IThumbnails;

	/// <summary>
	/// Retrieve the local path of an image of the given item.
	/// </summary>
	/// <param name="item">The item to retrieve the poster from.</param>
	/// <param name="image">The ID of the image.</param>
	/// <param name="quality">The quality of the image</param>
	/// <typeparam name="T">The type of the item</typeparam>
	/// <returns>The path of the image for the given resource or null if it does not exists.</returns>
	string GetImagePath<T>(T item, string image, ImageQuality quality)
		where T : IThumbnails;

	/// <summary>
	/// Delete images associated with the item.
	/// </summary>
	/// <param name="item">
	/// The item with cached images.
	/// </param>
	/// <typeparam name="T">The type of the item</typeparam>
	/// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
	Task DeleteImages<T>(T item)
		where T : IThumbnails;

	/// <summary>
	/// Set the user's profile picture
	/// </summary>
	/// <param name="userId">The id of the user. </param>
	/// <returns>The byte stream of the image. Null if no image exist.</returns>
	Task<Stream> GetUserImage(Guid userId);

	/// <summary>
	/// Set the user's profile picture
	/// </summary>
	/// <param name="userId">The id of the user. </param>
	/// <param name="image">The byte stream of the image. Null to delete the image.</param>
	Task SetUserImage(Guid userId, Stream? image);
}
