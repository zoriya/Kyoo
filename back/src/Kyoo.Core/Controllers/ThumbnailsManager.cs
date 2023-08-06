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
using System.Net.Http;
using System.Threading.Tasks;
using BlurHashSharp.SkiaSharp;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Microsoft.Extensions.Logging;
using SkiaSharp;

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

		private static async Task _WriteTo(SKBitmap bitmap, string path)
		{
			SKData data = bitmap.Encode(SKEncodedImageFormat.Jpeg, 18);
			await using Stream reader = data.AsStream();
			await using Stream file = File.Create(path);
			await reader.CopyToAsync(file);
		}

		private async Task _DownloadImage(string? url, string localPath, string what)
		{
			if (url == null)
				return;
			try
			{
				_logger.LogInformation("Downloading image {What}", what);

				HttpClient client = _clientFactory.CreateClient();
				HttpResponseMessage response = await client.GetAsync(url);
				response.EnsureSuccessStatusCode();
				await using Stream reader = await response.Content.ReadAsStreamAsync();
				SKBitmap bitmap = SKBitmap.Decode(reader);

				bitmap.Resize(new SKSizeI(bitmap.Width, bitmap.Height), SKFilterQuality.High);
				await _WriteTo(bitmap, $"{localPath}.{ImageQuality.High.ToString().ToLowerInvariant()}.jpg");

				bitmap.Resize(new SKSizeI(bitmap.Width, bitmap.Height), SKFilterQuality.Medium);
				await _WriteTo(bitmap, $"{localPath}.{ImageQuality.Medium.ToString().ToLowerInvariant()}.jpg");

				bitmap.Resize(new SKSizeI(bitmap.Width, bitmap.Height), SKFilterQuality.Low);
				await _WriteTo(bitmap, $"{localPath}.{ImageQuality.Low.ToString().ToLowerInvariant()}.jpg");
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "{What} could not be downloaded", what);
			}
		}

		/// <inheritdoc />
		public async Task DownloadImages<T>(T item)
			where T : IThumbnails
		{
			if (item == null)
				throw new ArgumentNullException(nameof(item));

			string name = item is IResource res ? res.Slug : "???";
			await _DownloadImage(item.Poster?.Source, _GetBaseImagePath(item, "poster"), $"The poster of {name}");
			await _DownloadImage(item.Thumbnail?.Source, _GetBaseImagePath(item, "thumbnail"), $"The poster of {name}");
			await _DownloadImage(item.Logo?.Source, _GetBaseImagePath(item, "logo"), $"The poster of {name}");
		}

		private static string _GetBaseImagePath<T>(T item, string image)
		{
			string directory = item switch
			{
				IResource res => Path.Combine("./metadata", typeof(T).Name.ToLowerInvariant(), res.Slug),
				_ => Path.Combine("./metadata", typeof(T).Name.ToLowerInvariant())
			};
			Directory.CreateDirectory(directory);
			return Path.Combine(directory, image);
		}

		/// <inheritdoc />
		public string GetImagePath<T>(T item, string image, ImageQuality quality)
			where T : IThumbnails
		{
			return $"{_GetBaseImagePath(item, image)}.{quality.ToString().ToLowerInvariant()}.jpg";
		}
	}
}
