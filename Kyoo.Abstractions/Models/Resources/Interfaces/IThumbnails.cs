using System.Collections.Generic;
using Kyoo.Abstractions.Controllers;

namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// An interface representing items that contains images (like posters, thumbnails, logo, banners...)
	/// </summary>
	public interface IThumbnails
	{
		/// <summary>
		/// The list of images mapped to a certain index.
		/// The string value should be a path supported by the <see cref="IFileSystem"/>.
		/// </summary>
		/// <remarks>
		/// An arbitrary index should not be used, instead use indexes from <see cref="Models.Images"/>
		/// </remarks>
		public Dictionary<int, string> Images { get; set; }
		
		// TODO remove Posters properties add them via the json serializer for every IThumbnails
	}

	/// <summary>
	/// A class containing constant values for images. To be used as index of a <see cref="IThumbnails.Images"/>.
	/// </summary>
	public static class Images
	{
		/// <summary>
		/// A poster is a 9/16 format image with the cover of the resource.
		/// </summary>
		public const int Poster = 0;

		/// <summary>
		/// A thumbnail is a 16/9 format image, it could ether be used as a background or as a preview but it usually
		/// is not an official image.
		/// </summary>
		public const int Thumbnail = 1;

		/// <summary>
		/// A logo is a small image representing the resource.
		/// </summary>
		public const int Logo = 2;

		/// <summary>
		/// A video of a few minutes that tease the content.
		/// </summary>
		public const int Trailer = 3;
	}
}