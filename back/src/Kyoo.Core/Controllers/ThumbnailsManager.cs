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
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.Logging;

#nullable enable

namespace Kyoo.Core.Controllers
{
	/// <summary>
	/// Download images and retrieve the path of those images for a resource.
	/// </summary>
	public class ThumbnailsManager : IThumbnailsManager
	{
		/// <summary>
		/// A logger to report errors.
		/// </summary>
		private readonly ILogger<ThumbnailsManager> _logger;

		private readonly IHttpClientFactory _clientFactory;

		/// <summary>
		/// Create a new <see cref="ThumbnailsManager"/>.
		/// </summary>
		/// <param name="clientFactory">Client factory</param>
		/// <param name="logger">A logger to report errors</param>
		public ThumbnailsManager(IHttpClientFactory clientFactory,
			ILogger<ThumbnailsManager> logger)
		{
			_clientFactory = clientFactory;
			_logger = logger;
		}

		/// <summary>
		/// An helper function to download an image.
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
				_logger.LogInformation("Downloading image {What}", what);

				HttpClient client = _clientFactory.CreateClient();
				HttpResponseMessage response = await client.GetAsync(url);
				response.EnsureSuccessStatusCode();
				string mime = response.Content.Headers.ContentType?.MediaType!;
				await using Stream reader = await response.Content.ReadAsStreamAsync();

				string extension = new FileExtensionContentTypeProvider()
					.Mappings.FirstOrDefault(x => x.Value == mime)
					.Key;
				await using Stream local = File.Create(localPath + extension);
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
				string localPath = _GetPrivateImagePath(item, id);
				if (alwaysDownload || !Path.Exists(localPath))
					ret |= await _DownloadImage(image, localPath, $"The image n {id} of {name}");
			}

			return ret;
		}

		/// <summary>
		/// Retrieve the local path of an image of the given item <b>without an extension</b>.
		/// </summary>
		/// <param name="item">The item to retrieve the poster from.</param>
		/// <param name="imageId">The ID of the image. See <see cref="Images"/> for values.</param>
		/// <typeparam name="T">The type of the item</typeparam>
		/// <returns>The path of the image for the given resource, <b>even if it does not exists</b></returns>
		private static string _GetPrivateImagePath<T>(T item, int imageId)
		{
			if (item == null)
				throw new ArgumentNullException(nameof(item));

			string directory = item switch
			{
				IResource res => Path.Combine("./metadata", typeof(T).Name.ToLowerInvariant(), res.Slug),
				_ => Path.Combine("./metadata", typeof(T).Name.ToLowerInvariant())
			};
			Directory.CreateDirectory(directory);
			string imageName = imageId switch
			{
				Images.Poster => "poster",
				Images.Logo => "logo",
				Images.Thumbnail => "thumbnail",
				Images.Trailer => "trailer",
				_ => $"{imageId}"
			};
			return Path.Combine(directory, imageName);
		}

		/// <inheritdoc />
		public string? GetImagePath<T>(T item, int imageId)
			where T : IThumbnails
		{
			string basePath = _GetPrivateImagePath(item, imageId);
			string directory = Path.GetDirectoryName(basePath)!;
			string baseFile = Path.GetFileName(basePath);
			if (!Directory.Exists(directory))
				return null;
			return Directory.GetFiles(directory, "*", SearchOption.TopDirectoryOnly)
				.FirstOrDefault(x => Path.GetFileNameWithoutExtension(x) == baseFile);
		}
	}
}
