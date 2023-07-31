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
using Kyoo.Abstractions.Models;

#nullable enable

namespace Kyoo.Abstractions.Controllers
{
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
		/// <param name="alwaysDownload">
		/// <c>true</c> if images should be downloaded even if they already exists locally, <c>false</c> otherwise.
		/// </param>
		/// <typeparam name="T">The type of the item</typeparam>
		/// <returns><c>true</c> if an image has been downloaded, <c>false</c> otherwise.</returns>
		Task<bool> DownloadImages<T>(T item, bool alwaysDownload = false)
			where T : IThumbnails;

		/// <summary>
		/// Retrieve the local path of an image of the given item.
		/// </summary>
		/// <param name="item">The item to retrieve the poster from.</param>
		/// <param name="imageId">The ID of the image. See <see cref="Images"/> for values.</param>
		/// <typeparam name="T">The type of the item</typeparam>
		/// <returns>The path of the image for the given resource or null if it does not exists.</returns>
		string? GetImagePath<T>(T item, int imageId)
			where T : IThumbnails;
	}
}
