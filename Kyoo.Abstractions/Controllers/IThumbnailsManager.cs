using System.Threading.Tasks;
using JetBrains.Annotations;
using Kyoo.Abstractions.Models;

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
		Task<bool> DownloadImages<T>([NotNull] T item, bool alwaysDownload = false)
			where T : IThumbnails;

		/// <summary>
		/// Retrieve the local path of an image of the given item.
		/// </summary>
		/// <param name="item">The item to retrieve the poster from.</param>
		/// <param name="imageID">The ID of the image. See <see cref="Images"/> for values.</param>
		/// <typeparam name="T">The type of the item</typeparam>
		/// <returns>The path of the image for the given resource or null if it does not exists.</returns>
		Task<string> GetImagePath<T>([NotNull] T item, int imageID)
			where T : IThumbnails;
	}
}
