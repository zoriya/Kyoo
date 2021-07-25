using Kyoo.Models;
using System;
using System.IO;
using System.Threading.Tasks;
using JetBrains.Annotations;
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

		/// <inheritdoc />
		public Task<bool> DownloadImages<T>(T item, bool alwaysDownload = false) 
			where T : IResource
		{
			if (item == null)
				throw new ArgumentNullException(nameof(item));
			return item switch
			{
				Show show => _Validate(show, alwaysDownload),
				Season season => _Validate(season, alwaysDownload),
				Episode episode => _Validate(episode, alwaysDownload),
				People people => _Validate(people, alwaysDownload),
				Provider provider => _Validate(provider, alwaysDownload),
				_ => Task.FromResult(false)
			};
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

		/// <summary>
		/// Download images of a specified show.
		/// </summary>
		/// <param name="show">
		/// The item to cache images.
		/// </param>
		/// <param name="alwaysDownload">
		/// <c>true</c> if images should be downloaded even if they already exists locally, <c>false</c> otherwise.
		/// </param>
		/// <returns><c>true</c> if an image has been downloaded, <c>false</c> otherwise.</returns>
		private async Task<bool> _Validate([NotNull] Show show, bool alwaysDownload)
		{
			bool ret = false;
			
			if (show.Poster != null)
			{
				string posterPath = await GetPoster(show);
				if (alwaysDownload || !await _files.Exists(posterPath))
					ret |= await _DownloadImage(show.Poster, posterPath, $"The poster of {show.Title}");
			}
			if (show.Logo != null)
			{
				string logoPath = await GetLogo(show);
				if (alwaysDownload || !await _files.Exists(logoPath))
					ret |= await _DownloadImage(show.Logo, logoPath, $"The logo of {show.Title}");
			}
			if (show.Backdrop != null)
			{
				string backdropPath = await GetThumbnail(show);
				if (alwaysDownload || !await _files.Exists(backdropPath))
					ret |= await _DownloadImage(show.Backdrop, backdropPath, $"The backdrop of {show.Title}");
			}

			return ret;
		}

		/// <summary>
		/// Download images of a specified person.
		/// </summary>
		/// <param name="people">
		/// The item to cache images.
		/// </param>
		/// <param name="alwaysDownload">
		/// <c>true</c> if images should be downloaded even if they already exists locally, <c>false</c> otherwise.
		/// </param>
		/// <returns><c>true</c> if an image has been downloaded, <c>false</c> otherwise.</returns>
		private async Task<bool> _Validate([NotNull] People people, bool alwaysDownload)
		{
			if (people == null)
				throw new ArgumentNullException(nameof(people));
			if (people.Poster == null)
				return false;
			string localPath = await GetPoster(people);
			if (alwaysDownload || !await _files.Exists(localPath))
				return await _DownloadImage(people.Poster, localPath, $"The profile picture of {people.Name}");
			return false;
		}

		/// <summary>
		/// Download images of a specified season.
		/// </summary>
		/// <param name="season">
		/// The item to cache images.
		/// </param>
		/// <param name="alwaysDownload">
		/// <c>true</c> if images should be downloaded even if they already exists locally, <c>false</c> otherwise.
		/// </param>
		/// <returns><c>true</c> if an image has been downloaded, <c>false</c> otherwise.</returns>
		private async Task<bool> _Validate([NotNull] Season season, bool alwaysDownload)
		{
			if (season.Poster == null)
				return false;

			string localPath = await GetPoster(season);
			if (alwaysDownload || !await _files.Exists(localPath))
				return await _DownloadImage(season.Poster, localPath, $"The poster of {season.Slug}");
			return false;
		}
		
		/// <summary>
		/// Download images of a specified episode.
		/// </summary>
		/// <param name="episode">
		/// The item to cache images.
		/// </param>
		/// <param name="alwaysDownload">
		/// <c>true</c> if images should be downloaded even if they already exists locally, <c>false</c> otherwise.
		/// </param>
		/// <returns><c>true</c> if an image has been downloaded, <c>false</c> otherwise.</returns>
		private async Task<bool> _Validate([NotNull] Episode episode, bool alwaysDownload)
		{
			if (episode.Thumb == null)
				return false;

			string localPath = await _GetEpisodeThumb(episode);
			if (alwaysDownload || !await _files.Exists(localPath))
				return await _DownloadImage(episode.Thumb, localPath, $"The thumbnail of {episode.Slug}");
			return false;
		}

		/// <summary>
		/// Download images of a specified provider.
		/// </summary>
		/// <param name="provider">
		/// The item to cache images.
		/// </param>
		/// <param name="alwaysDownload">
		/// <c>true</c> if images should be downloaded even if they already exists locally, <c>false</c> otherwise.
		/// </param>
		/// <returns><c>true</c> if an image has been downloaded, <c>false</c> otherwise.</returns>
		private async Task<bool> _Validate([NotNull] Provider provider, bool alwaysDownload)
		{
			if (provider.Logo == null)
				return false;

			string localPath = await GetLogo(provider);
			if (alwaysDownload || !await _files.Exists(localPath))
				return await _DownloadImage(provider.Logo, localPath, $"The logo of {provider.Slug}");
			return false;
		}

		/// <inheritdoc />
		public Task<string> GetPoster<T>(T item)
			where T : IResource
		{
			if (item == null)
				throw new ArgumentNullException(nameof(item));
			return item switch
			{
				Show show => Task.FromResult(_files.Combine(_files.GetExtraDirectory(show), "poster.jpg")),
				Season season => _GetSeasonPoster(season),
				People actor => Task.FromResult(_files.Combine(_options.CurrentValue.PeoplePath, $"{actor.Slug}.jpg")),
				_ => throw new NotSupportedException($"The type {typeof(T).Name} does not have a poster.")
			};
		}

		/// <summary>
		/// Retrieve the path of a season's poster.
		/// </summary>
		/// <param name="season">The season to retrieve the poster from.</param>
		/// <returns>The path of the season's poster.</returns>
		private async Task<string> _GetSeasonPoster(Season season)
		{
			if (season.Show == null)
				await _library.Value.Load(season, x => x.Show);
			return _files.Combine(_files.GetExtraDirectory(season.Show), $"season-{season.SeasonNumber}.jpg");
		}
		
		/// <inheritdoc />
		public Task<string> GetThumbnail<T>(T item)
			where T : IResource
		{
			if (item == null)
				throw new ArgumentNullException(nameof(item));
			return item switch
			{
				Show show => Task.FromResult(_files.Combine(_files.GetExtraDirectory(show), "backdrop.jpg")),
				Episode episode => _GetEpisodeThumb(episode),
				_ => throw new NotSupportedException($"The type {typeof(T).Name} does not have a thumbnail.")
			};
		}
		
		/// <summary>
		/// Get the path for an episode's thumbnail.
		/// </summary>
		/// <param name="episode">The episode to retrieve the thumbnail from</param>
		/// <returns>The path of the given episode's thumbnail.</returns>
		private async Task<string> _GetEpisodeThumb(Episode episode)
		{
			if (episode.Show == null)
				await _library.Value.Load(episode, x => x.Show);
			string dir = _files.Combine(_files.GetExtraDirectory(episode.Show), "Thumbnails");
			await _files.CreateDirectory(dir);
			return _files.Combine(dir, $"{Path.GetFileNameWithoutExtension(episode.Path)}.jpg");
		}

		/// <inheritdoc />
		public Task<string> GetLogo<T>(T item)
			where T : IResource
		{
			if (item == null)
				throw new ArgumentNullException(nameof(item));
			return Task.FromResult(item switch
			{
				Show show => _files.Combine(_files.GetExtraDirectory(show), "logo.png"),
				Provider provider => _files.Combine(_options.CurrentValue.ProviderPath, 
				                                    $"{provider.Slug}.{provider.LogoExtension}"),
				_ => throw new NotSupportedException($"The type {typeof(T).Name} does not have a thumbnail.")
			});
		}
	}
}
