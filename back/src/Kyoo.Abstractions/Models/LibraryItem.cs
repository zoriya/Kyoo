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
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Kyoo.Utils;

namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// The type of item, ether a show, a movie or a collection.
	/// </summary>
	public enum ItemKind
	{
		/// <summary>
		/// The <see cref="LibraryItem"/> is a <see cref="Show"/>.
		/// </summary>
		Show,

		/// <summary>
		/// The <see cref="LibraryItem"/> is a Movie.
		/// </summary>
		Movie,

		/// <summary>
		/// The <see cref="LibraryItem"/> is a <see cref="Collection"/>.
		/// </summary>
		Collection
	}

	public class LibraryItem : IResource, ILibraryItem, IThumbnails, IMetadata
	{
		/// <inheritdoc />
		public int Id { get; set; }

		/// <inheritdoc />
		[MaxLength(256)]
		public string Slug { get; set; }

		/// <summary>
		/// The title of this show.
		/// </summary>
		public string Name { get; set; }

		/// <summary>
		/// A catchphrase for this movie.
		/// </summary>
		public string? Tagline { get; set; }

		/// <summary>
		/// The list of alternative titles of this show.
		/// </summary>
		public string[] Aliases { get; set; } = Array.Empty<string>();

		/// <summary>
		/// The path of the movie video file.
		/// </summary>
		public string? Path { get; set; }

		/// <summary>
		/// The summary of this show.
		/// </summary>
		public string? Overview { get; set; }

		/// <summary>
		/// A list of tags that match this movie.
		/// </summary>
		public string[] Tags { get; set; } = Array.Empty<string>();

		/// <summary>
		/// The list of genres (themes) this show has.
		/// </summary>
		public Genre[] Genres { get; set; } = Array.Empty<Genre>();

		/// <summary>
		/// Is this show airing, not aired yet or finished?
		/// </summary>
		public Status Status { get; set; }

		/// <summary>
		/// The date this show started airing. It can be null if this is unknown.
		/// </summary>
		public DateTime? StartAir { get; set; }

		/// <summary>
		/// The date this show finished airing.
		/// It can also be null if this is unknown.
		/// </summary>
		public DateTime? EndAir { get; set; }

		/// <summary>
		/// The date this movie aired.
		/// </summary>
		public DateTime? AirDate { get; set; }

		/// <inheritdoc />
		public Image? Poster { get; set; }

		/// <inheritdoc />
		public Image? Thumbnail { get; set; }

		/// <inheritdoc />
		public Image? Logo { get; set; }

		/// <summary>
		/// A video of a few minutes that tease the content.
		/// </summary>
		public string? Trailer { get; set; }

		/// <inheritdoc />
		public ItemKind Kind { get; set; }

		/// <inheritdoc />
		public Dictionary<string, MetadataId> ExternalId { get; set; } = new();

		/// <summary>
		/// Links to watch this movie.
		/// </summary>
		public VideoLinks? Links => Kind == ItemKind.Movie ? new()
		{
			Direct = $"/video/movie/{Slug}/direct",
			Hls = $"/video/movie/{Slug}/master.m3u8",
		}
		: null;

		public LibraryItem() { }

		[JsonConstructor]
		public LibraryItem(string name)
		{
			Slug = Utility.ToSlug(name);
			Name = name;
		}
	}

	/// <summary>
	/// A type union between <see cref="Show"/> and <see cref="Collection"/>.
	/// This is used to list content put inside a library.
	/// </summary>
	public interface ILibraryItem : IResource
	{
		/// <summary>
		/// Is the item a collection, a movie or a show?
		/// </summary>
		public ItemKind Kind { get; }

		/// <summary>
		/// The title of this show.
		/// </summary>
		public string Name { get; }

		/// <summary>
		/// The summary of this show.
		/// </summary>
		public string? Overview { get; }

		/// <summary>
		/// The date this movie aired.
		/// </summary>
		public DateTime? AirDate { get; }
	}
}
