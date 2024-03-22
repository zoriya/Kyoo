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
using Kyoo.Abstractions.Controllers;
using Kyoo.Utils;

namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// A class representing collections of <see cref="Show"/>.
	/// </summary>
	public class Collection : IQuery, IResource, IMetadata, IThumbnails, IAddedDate, ILibraryItem
	{
		public static Sort DefaultSort => new Sort<Collection>.By(nameof(Collection.Name));

		/// <inheritdoc />
		public Guid Id { get; set; }

		/// <inheritdoc />
		[MaxLength(256)]
		public string Slug { get; set; }

		/// <summary>
		/// The name of this collection.
		/// </summary>
		public string Name { get; set; }

		/// <summary>
		/// The description of this collection.
		/// </summary>
		public string? Overview { get; set; }

		/// <inheritdoc />
		public DateTime AddedDate { get; set; }

		/// <inheritdoc />
		public Image? Poster { get; set; }

		/// <inheritdoc />
		public Image? Thumbnail { get; set; }

		/// <inheritdoc />
		public Image? Logo { get; set; }

		/// <summary>
		/// The list of movies contained in this collection.
		/// </summary>
		[JsonIgnore]
		public ICollection<Movie>? Movies { get; set; }

		/// <summary>
		/// The list of shows contained in this collection.
		/// </summary>
		[JsonIgnore]
		public ICollection<Show>? Shows { get; set; }

		/// <inheritdoc />
		public Dictionary<string, MetadataId> ExternalId { get; set; } = new();

		public Collection() { }

		[JsonConstructor]
		public Collection(string name)
		{
			if (name != null)
			{
				Slug = Utility.ToSlug(name);
				Name = name;
			}
		}
	}
}
