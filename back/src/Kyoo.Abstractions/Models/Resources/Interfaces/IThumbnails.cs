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
using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Kyoo.Abstractions.Models;

/// <summary>
/// An interface representing items that contains images (like posters, thumbnails, logo, banners...)
/// </summary>
public interface IThumbnails
{
	/// <summary>
	/// A poster is a 2/3 format image with the cover of the resource.
	/// </summary>
	public Image? Poster { get; set; }

	/// <summary>
	/// A thumbnail is a 16/9 format image, it could ether be used as a background or as a preview but it usually
	/// is not an official image.
	/// </summary>
	public Image? Thumbnail { get; set; }

	/// <summary>
	/// A logo is a small image representing the resource.
	/// </summary>
	public Image? Logo { get; set; }
}

[JsonConverter(typeof(ImageConvertor))]
public class Image
{
	/// <summary>
	/// A unique identifier for the image. Used for proper http caches.
	/// </summary>
	public Guid Id { get; set; }

	/// <summary>
	/// The original image from another server.
	/// </summary>
	public string Source { get; set; }

	/// <summary>
	/// A hash to display as placeholder while the image is loading.
	/// </summary>
	[MaxLength(32)]
	public string Blurhash { get; set; }

	/// <summary>
	/// The url to access the image in low quality.
	/// </summary>
	public string Low => $"/thumbnails/{Id}?quality=low";

	/// <summary>
	/// The url to access the image in medium quality.
	/// </summary>
	public string Medium => $"/thumbnails/{Id}?quality=medium";

	/// <summary>
	/// The url to access the image in high quality.
	/// </summary>
	public string High => $"/thumbnails/{Id}?quality=high";

	public Image() { }

	[JsonConstructor]
	public Image(string source, string? blurhash = null)
	{
		Source = source;
		Blurhash = blurhash ?? "000000";
	}

	public class ImageConvertor : JsonConverter<Image>
	{
		/// <inheritdoc />
		public override Image? Read(
			ref Utf8JsonReader reader,
			Type typeToConvert,
			JsonSerializerOptions options
		)
		{
			if (reader.TokenType == JsonTokenType.String && reader.GetString() is string source)
				return new Image(source);
			using JsonDocument document = JsonDocument.ParseValue(ref reader);
			return document.RootElement.Deserialize<Image>();
		}

		/// <inheritdoc />
		public override void Write(
			Utf8JsonWriter writer,
			Image value,
			JsonSerializerOptions options
		)
		{
			writer.WriteStartObject();
			writer.WriteString("source", value.Source);
			writer.WriteString("blurhash", value.Blurhash);
			writer.WriteString("low", value.Low);
			writer.WriteString("medium", value.Medium);
			writer.WriteString("high", value.High);
			writer.WriteEndObject();
		}
	}
}

/// <summary>
/// The quality of an image
/// </summary>
public enum ImageQuality
{
	/// <summary>
	/// Small
	/// </summary>
	Low,

	/// <summary>
	/// Medium
	/// </summary>
	Medium,

	/// <summary>
	/// Large
	/// </summary>
	High,
}
