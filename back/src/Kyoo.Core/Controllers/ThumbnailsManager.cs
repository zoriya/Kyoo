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
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;
using Blurhash.SkiaSharp;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Exceptions;
using Microsoft.Extensions.Logging;
using SkiaSharp;

namespace Kyoo.Core.Controllers
{
	/// <summary>
	/// Download images and retrieve the path of those images for a resource.
	/// </summary>
	public class ThumbnailsManager : IThumbnailsManager
	{
		private static readonly Dictionary<string, TaskCompletionSource<object>> _downloading = new();

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

		private static async Task _WriteTo(SKBitmap bitmap, string path, int quality)
		{
			SKData data = bitmap.Encode(SKEncodedImageFormat.Webp, quality);
			await using Stream reader = data.AsStream();
			await using Stream file = File.Create(path);
			await reader.CopyToAsync(file);
		}

		private async Task _DownloadImage(Image? image, string localPath, string what)
		{
			if (image == null)
				return;
			try
			{
				_logger.LogInformation("Downloading image {What}", what);

				HttpClient client = _clientFactory.CreateClient();
				HttpResponseMessage response = await client.GetAsync(image.Source);
				response.EnsureSuccessStatusCode();
				await using Stream reader = await response.Content.ReadAsStreamAsync();
				using SKCodec codec = SKCodec.Create(reader);
				if (codec == null)
				{
					_logger.LogError("Unsupported codec for {What}", what);
					return;
				}

				SKImageInfo info = codec.Info;
				info.ColorType = SKColorType.Rgba8888;
				using SKBitmap original = SKBitmap.Decode(codec, info);

				using SKBitmap high = original.Resize(new SKSizeI(original.Width, original.Height), SKFilterQuality.High);
				await _WriteTo(original, $"{localPath}.{ImageQuality.High.ToString().ToLowerInvariant()}.webp", 90);

				using SKBitmap medium = high.Resize(new SKSizeI((int)(high.Width / 1.5), (int)(high.Height / 1.5)), SKFilterQuality.Medium);
				await _WriteTo(medium, $"{localPath}.{ImageQuality.Medium.ToString().ToLowerInvariant()}.webp", 75);

				using SKBitmap low = medium.Resize(new SKSizeI(original.Width / 2, original.Height / 2), SKFilterQuality.Low);
				await _WriteTo(low, $"{localPath}.{ImageQuality.Low.ToString().ToLowerInvariant()}.webp", 50);

				image.Blurhash = Blurhasher.Encode(low, 4, 3);
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
			string name = item is IResource res ? res.Slug : "???";

			string posterPath = $"{_GetBaseImagePath(item, "poster")}.{ImageQuality.High.ToString().ToLowerInvariant()}.webp";
			bool duplicated = false;
			TaskCompletionSource<object>? sync = null;
			try
			{
				lock (_downloading)
				{
					if (File.Exists(posterPath) || _downloading.ContainsKey(posterPath))
					{
						duplicated = true;
						sync = _downloading.GetValueOrDefault(posterPath);
					}
					else
					{
						sync = new();
						_downloading.Add(posterPath, sync);
					}
				}
				if (duplicated)
				{
					object? dup = sync != null
						? await sync.Task
						: null;
					throw new DuplicatedItemException(dup);
				}

				await _DownloadImage(item.Poster, _GetBaseImagePath(item, "poster"), $"The poster of {name}");
				await _DownloadImage(item.Thumbnail, _GetBaseImagePath(item, "thumbnail"), $"The poster of {name}");
				await _DownloadImage(item.Logo, _GetBaseImagePath(item, "logo"), $"The poster of {name}");
			}
			finally
			{
				if (!duplicated)
				{
					lock (_downloading)
					{
						_downloading.Remove(posterPath);
						sync!.SetResult(item);
					}
				}
			}
		}

		private static string _GetBaseImagePath<T>(T item, string image)
		{
			string directory = item switch
			{
				IResource res => Path.Combine("./metadata", item.GetType().Name.ToLowerInvariant(), res.Slug),
				_ => Path.Combine("./metadata", typeof(T).Name.ToLowerInvariant())
			};
			Directory.CreateDirectory(directory);
			return Path.Combine(directory, image);
		}

		/// <inheritdoc />
		public string GetImagePath<T>(T item, string image, ImageQuality quality)
			where T : IThumbnails
		{
			return $"{_GetBaseImagePath(item, image)}.{quality.ToString().ToLowerInvariant()}.webp";
		}
	}
}
