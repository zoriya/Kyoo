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
		/// The <see cref="LibraryItem"/> is a Movie (a <see cref="Show"/> with
		/// <see cref="Models.Show.IsMovie"/> equals to true).
		/// </summary>
		Movie,

		/// <summary>
		/// The <see cref="LibraryItem"/> is a <see cref="Collection"/>.
		/// </summary>
		Collection
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

		public string Name { get; }

		public DateTime? AirDate { get; }

		public Image Poster { get; }
	}

	public class BagItem : ILibraryItem
	{
		public ItemKind Kind { get; }

		public int Id { get; set; }

		public string Slug { get; set;  }

		public string Name { get; set; }

		public DateTime? AirDate { get; set; }

		public Image Poster { get; set; }

		public object Rest { get; set; }

		public ILibraryItem ToItem()
		{
			return Kind switch
			{
				ItemKind.Movie => Rest as MovieItem,
				ItemKind.Show => Rest as ShowItem,
				ItemKind.Collection => Rest as CollectionItem,
			};
		}
	}

	public sealed class ShowItem : Show, ILibraryItem
	{
		/// <inheritdoc/>
		public ItemKind Kind => ItemKind.Show;

		public DateTime? AirDate => StartAir;
	}

	public sealed class MovieItem : Movie, ILibraryItem
	{
		/// <inheritdoc/>
		public ItemKind Kind => ItemKind.Movie;
	}

	public sealed class CollectionItem : Collection, ILibraryItem
	{
		/// <inheritdoc/>
		public ItemKind Kind => ItemKind.Collection;

		public DateTime? AirDate => null;
	}

}
