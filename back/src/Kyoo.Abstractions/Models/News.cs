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

namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// The type of item, ether a show, a movie or a collection.
	/// </summary>
	public enum NewsKind
	{
		/// <summary>
		/// The <see cref="LibraryItem"/> is an <see cref="Episode"/>.
		/// </summary>
		Episode,

		/// <summary>
		/// The <see cref="LibraryItem"/> is a Movie.
		/// </summary>
		Movie,
	}

	/// <summary>
	/// A new item
	/// </summary>
	public class News : IResource, IMetadata, IThumbnails, IAddedDate
	{
		/// <inheritdoc />
		public int Id { get; set; }

		/// <inheritdoc />
		[MaxLength(256)]
		public string Slug { get; set; }

		/// <summary>
		/// The title of this show.
		/// </summary>
		public string? Name { get; set; }

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
		public string Path { get; set; }

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
		public Status? Status { get; set; }

		/// <summary>
		/// How well this item is rated? (from 0 to 100).
		/// </summary>
		public int? Rating { get; set; }

		/// <summary>
		/// How long is this movie or episode? (in minutes)
		/// </summary>
		public int Runtime { get; set; }

		/// <summary>
		/// The date this movie aired.
		/// </summary>
		public DateTime? AirDate { get; set; }

		/// <summary>
		/// The date this movie aired.
		/// </summary>
		public DateTime? ReleaseDate => AirDate;

		/// <inheritdoc />
		public DateTime AddedDate { get; set; }

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
		public Dictionary<string, MetadataId> ExternalId { get; set; } = new();

		/// <summary>
		/// The season in witch this episode is in.
		/// </summary>
		public int? SeasonNumber { get; set; }

		/// <summary>
		/// The number of this episode in it's season.
		/// </summary>
		public int? EpisodeNumber { get; set; }

		/// <summary>
		/// The absolute number of this episode. It's an episode number that is not reset to 1 after a new season.
		/// </summary>
		public int? AbsoluteNumber { get; set; }

		/// <summary>
		/// A simple summary of informations about the show of this episode
		/// (this is specially useful since news can't have includes).
		/// </summary>
		public ShowInfo? Show { get; set; }

		/// <summary>
		/// Is the item a a movie or an episode?
		/// </summary>
		public NewsKind Kind { get; set; }

		/// <summary>
		/// Links to watch this movie.
		/// </summary>
		public VideoLinks Links => new()
		{
			Direct = $"/video/{Kind.ToString().ToLower()}/{Slug}/direct",
			Hls = $"/video/{Kind.ToString().ToLower()}/{Slug}/master.m3u8",
		};

		/// <summary>
		/// A simple summary of informations about the show of this episode
		/// (this is specially useful since news can't have includes).
		/// </summary>
		public class ShowInfo : IResource, IThumbnails
		{
			/// <inheritdoc/>
			public int Id { get; set; }

			/// <inheritdoc/>
			public string Slug { get; set; }

			/// <summary>
			/// The title of this show.
			/// </summary>
			public string Name { get; set; }

			/// <inheritdoc />
			public Image? Poster { get; set; }

			/// <inheritdoc />
			public Image? Thumbnail { get; set; }

			/// <inheritdoc />
			public Image? Logo { get; set; }
		}
	}
}
