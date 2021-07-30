using Kyoo.Models;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Models.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

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
		/// The options containing the base path of people images and provider logos.
		/// </summary>
		private readonly IOptionsMonitor<BasicOptions> _options;
		/// <summary>
		/// A library manager used to load episode and seasons shows if they are not loaded.
		/// </summary>
		private readonly Lazy<ILibraryManager> _library;

		/// <summary>
		/// Create a new <see cref="ThumbnailsManager"/>.
		/// </summary>
		/// <param name="files">The file manager to use.</param>
		/// <param name="logger">A logger to report errors</param>
		/// <param name="options">The options to use.</param>
		/// <param name="library">A library manager used to load shows if they are not loaded.</param>
		public ThumbnailsManager(IFileSystem files, 
			ILogger<ThumbnailsManager> logger,
			IOptionsMonitor<BasicOptions> options, 
			Lazy<ILibraryManager> library)
		{
			_files = files;
			_logger = logger;
			_options = options;
			_library = library;

			options.OnChange(x =>
			{
				_files.CreateDirectory(x.PeoplePath);
				_files.CreateDirectory(x.ProviderPath);
			});
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
				Thumbnails.Poster => "poster.jpg",
				Thumbnails.Logo => "logo.jpg",
				Thumbnails.Thumbnail => "thumbnail.jpg",
				_ => $"{imageID}.jpg"
			};
			
			// TODO implement a generic way, probably need to rework IFileManager.GetExtraDirectory too.
			switch (item)
			{
				case Show show:
					return _files.Combine(_files.GetExtraDirectory(show), imageName);
				
				case Season season:
					if (season.Show == null)
						await _library.Value.Load(season, x => x.Show);
					return _files.Combine(
						_files.GetExtraDirectory(season.Show!),
						$"season-{season.SeasonNumber}-{imageName}");
				
				case Episode episode:
					if (episode.Show == null)
						await _library.Value.Load(episode, x => x.Show);
					string dir = _files.Combine(_files.GetExtraDirectory(episode.Show!), "Thumbnails");
					await _files.CreateDirectory(dir);
					return _files.Combine(dir, $"{Path.GetFileNameWithoutExtension(episode.Path)}-{imageName}");
				
				case People actor:
					return _files.Combine(_options.CurrentValue.PeoplePath, $"{actor.Slug}-{imageName}");
				
				case Provider provider:
					return _files.Combine(_options.CurrentValue.ProviderPath, $"{provider.Slug}-{imageName}");
				
				default:
					throw new NotSupportedException($"The type {typeof(T).Name} is not supported.");
			}
		}
	}
}
