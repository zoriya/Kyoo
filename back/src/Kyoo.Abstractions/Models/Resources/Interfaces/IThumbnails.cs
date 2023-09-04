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
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using Kyoo.Abstractions.Models.Attributes;

namespace Kyoo.Abstractions.Models
{
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

	[TypeConverter(typeof(ImageConvertor))]
	public class Image
	{
		/// <summary>
		/// The original image from another server.
		/// </summary>
		public string Source { get; set; }

		/// <summary>
		/// A hash to display as placeholder while the image is loading.
		/// </summary>
		[MaxLength(32)]
		public string Blurhash { get; set; }

		[SerializeIgnore]
		public string Path { private get; set; }

		/// <summary>
		/// The url to retrieve the low quality image.
		/// </summary>
		public string Low => $"{Path}?quality=low";

		/// <summary>
		/// The url to retrieve the medium quality image.
		/// </summary>
		public string Medium => $"{Path}?quality=medium";

		/// <summary>
		/// The url to retrieve the high quality image.
		/// </summary>
		public string High => $"{Path}?quality=high";

		public Image(string source, string? blurhash = null)
		{
			Source = source;
			Blurhash = blurhash ?? "00000000000000";
		}

		public class ImageConvertor : TypeConverter
		{
			/// <inheritdoc />
			public override bool CanConvertFrom(ITypeDescriptorContext? context, Type sourceType)
			{
				if (sourceType == typeof(string))
					return true;
				return base.CanConvertFrom(context, sourceType);
			}

			/// <inheritdoc />
			public override object ConvertFrom(ITypeDescriptorContext? context, CultureInfo? culture, object value)
			{
				if (value is not string source)
					return base.ConvertFrom(context, culture, value)!;
				return new Image(source);
			}

			/// <inheritdoc />
			public override bool CanConvertTo(ITypeDescriptorContext? context, Type? destinationType)
			{
				return false;
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
}
