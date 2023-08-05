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
using System.Text.RegularExpressions;
using JetBrains.Annotations;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models.Attributes;

namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// A season of a <see cref="Show"/>.
	/// </summary>
	public class Season : IResource, IMetadata, IThumbnails
	{
		/// <inheritdoc />
		public int Id { get; set; }

		/// <inheritdoc />
		[Computed]
		[MaxLength(256)]
		public string Slug
		{
			get
			{
				if (ShowSlug == null && Show == null)
					return $"{ShowID}-s{SeasonNumber}";
				return $"{ShowSlug ?? Show?.Slug}-s{SeasonNumber}";
			}

			[UsedImplicitly]
			[NotNull]
			private set
			{
				Match match = Regex.Match(value, @"(?<show>.+)-s(?<season>\d+)");

				if (!match.Success)
					throw new ArgumentException("Invalid season slug. Format: {showSlug}-s{seasonNumber}");
				ShowSlug = match.Groups["show"].Value;
				SeasonNumber = int.Parse(match.Groups["season"].Value);
			}
		}

		/// <summary>
		/// The slug of the Show that contain this episode. If this is not set, this season is ill-formed.
		/// </summary>
		[SerializeIgnore] public string? ShowSlug { private get; set; }

		/// <summary>
		/// The ID of the Show containing this season.
		/// </summary>
		[SerializeIgnore] public int ShowID { get; set; }

		/// <summary>
		/// The show that contains this season.
		/// This must be explicitly loaded via a call to <see cref="ILibraryManager.Load"/>.
		/// </summary>
		[LoadableRelation(nameof(ShowID))] public Show? Show { get; set; }

		/// <summary>
		/// The number of this season. This can be set to 0 to indicate specials.
		/// </summary>
		public int SeasonNumber { get; set; }

		/// <summary>
		/// The title of this season.
		/// </summary>
		public string? Name { get; set; }

		/// <summary>
		/// A quick overview of this season.
		/// </summary>
		public string? Overview { get; set; }

		/// <summary>
		/// The starting air date of this season.
		/// </summary>
		public DateTime? StartDate { get; set; }

		/// <summary>
		/// The ending date of this season.
		/// </summary>
		public DateTime? EndDate { get; set; }

		/// <inheritdoc />
		public Image? Poster { get; set; }

		/// <inheritdoc />
		public Image? Thumbnail { get; set; }

		/// <inheritdoc />
		public Image? Logo { get; set; }

		/// <inheritdoc />
		public Dictionary<string, MetadataId> ExternalId { get; set; } = new();

		/// <summary>
		/// The list of episodes that this season contains.
		/// </summary>
		[LoadableRelation] public ICollection<Episode>? Episodes { get; set; }
	}
}
