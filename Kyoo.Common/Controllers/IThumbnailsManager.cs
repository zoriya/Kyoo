using System;
using Kyoo.Models;
using System.Threading.Tasks;
using JetBrains.Annotations;

namespace Kyoo.Controllers
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
		Task<bool> DownloadImages<T>([NotNull] T item, bool alwaysDownload = false)
			where T : IThumbnails;


		/// <summary>
		/// Retrieve the local path of the poster of the given item.
		/// </summary>
		/// <param name="item">The item to retrieve the poster from.</param>
		/// <param name="imageID">The ID of the image. See <see cref="Images"/> for values.</param>
		/// <typeparam name="T">The type of the item</typeparam>
		/// <exception cref="NotSupportedException">If the type does not have a poster</exception>
		/// <returns>The path of the poster for the given resource (it might or might not exists).</returns>
		Task<string> GetImagePath<T>([NotNull] T item, int imageID)
			where T : IThumbnails;
	}
}
