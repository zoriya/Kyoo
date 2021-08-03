using Kyoo.Models;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace Kyoo.Controllers
{
	/// <summary>
	/// Download images and retrieve the path of those images for a resource.
	/// </summary>
	public class ThumbnailsManager : IThumbnailsManager
	{
		/// <summary>
		/// The file manager used to download the image if the file is distant
		/// </summary>
		private readonly IFileSystem _files;
		/// <summary>
		/// A logger to report errors.
		/// </summary>
		private readonly ILogger<ThumbnailsManager> _logger;

		/// <summary>
		/// Create a new <see cref="ThumbnailsManager"/>.
		/// </summary>
		/// <param name="files">The file manager to use.</param>
		/// <param name="logger">A logger to report errors</param>
		public ThumbnailsManager(IFileSystem files, 
			ILogger<ThumbnailsManager> logger)
		{
			_files = files;
			_logger = logger;
		}

		/// <summary>
		/// An helper function to download an image using a <see cref="LocalFileSystem"/>.
		/// </summary>
		/// <param name="url">The distant url of the image</param>
		/// <param name="localPath">The local path of the image</param>
		/// <param name="what">What is currently downloaded (used for errors)</param>
		/// <returns><c>true</c> if an image has been downloaded, <c>false</c> otherwise.</returns>
		private async Task<bool> _DownloadImage(string url, string localPath, string what)
		{
			if (url == localPath)
				return false;

			try
			{
				await using Stream reader = await _files.GetReader(url);
				await using Stream local = await _files.NewFile(localPath);
				await reader.CopyToAsync(local);
				return true;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "{What} could not be downloaded", what);
				return false;
			}
		}
		
		/// <inheritdoc />
		public async Task<bool> DownloadImages<T>(T item, bool alwaysDownload = false) 
			where T : IThumbnails
		{
			if (item == null)
				throw new ArgumentNullException(nameof(item));

			if (item.Images == null)
				return false;

			string name = item is IResource res ? res.Slug : "???";
			bool ret = false;

			foreach ((int id, string image) in item.Images.Where(x => x.Value != null))
			{
				string localPath = await GetImagePath(item, id);
				if (alwaysDownload || !await _files.Exists(localPath))
					ret |= await _DownloadImage(image, localPath, $"The image n°{id} of {name}");
			}
			
			return ret;
		}
		
		/// <inheritdoc />
		public async Task<string> GetImagePath<T>(T item, int imageID)
			where T : IThumbnails
		{
			if (item == null)
				throw new ArgumentNullException(nameof(item));
			// TODO handle extensions
			string imageName = imageID switch
			{
				Images.Poster => "poster.jpg",
				Images.Logo => "logo.jpg",
				Images.Thumbnail => "thumbnail.jpg",
				_ => $"{imageID}.jpg"
			};
			
			return _files.Combine(await _files.GetExtraDirectory(item), imageName);
		}
	}
}
