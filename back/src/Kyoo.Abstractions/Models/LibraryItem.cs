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
using System.ComponentModel;
using System.Linq.Expressions;

namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// The type of item, ether a show, a movie or a collection.
	/// </summary>
	public enum ItemType
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
	public class LibraryItem : CustomTypeDescriptor, IResource, IThumbnails
	{
		/// <inheritdoc />
		public int ID { get; set; }

		/// <inheritdoc />
		public string Slug { get; set; }

		/// <summary>
		/// The title of the show or collection.
		/// </summary>
		public string Title { get; set; }

		/// <summary>
		/// The summary of the show or collection.
		/// </summary>
		public string Overview { get; set; }

		/// <summary>
		/// Is this show airing, not aired yet or finished? This is only applicable for shows.
		/// </summary>
		public Status? Status { get; set; }

		/// <summary>
		/// The date this show or collection started airing. It can be null if this is unknown.
		/// </summary>
		public DateTime? StartAir { get; set; }

		/// <summary>
		/// The date this show or collection finished airing.
		/// It must be after the <see cref="StartAir"/> but can be the same (example: for movies).
		/// It can also be null if this is unknown.
		/// </summary>
		public DateTime? EndAir { get; set; }

		/// <inheritdoc />
		public Image Poster { get; set; }

		/// <inheritdoc />
		public Image Thumbnail { get; set; }

		/// <inheritdoc />
		public Image Logo { get; set; }

		/// <summary>
		/// The type of this item (ether a collection, a show or a movie).
		/// </summary>
		public ItemType Type { get; set; }

		/// <summary>
		/// Create a new, empty <see cref="LibraryItem"/>.
		/// </summary>
		public LibraryItem() { }

		/// <summary>
		/// Create a <see cref="LibraryItem"/> from a show.
		/// </summary>
		/// <param name="show">The show that this library item should represent.</param>
		public LibraryItem(Show show)
		{
			ID = show.ID;
			Slug = show.Slug;
			Title = show.Title;
			Overview = show.Overview;
			Status = show.Status;
			StartAir = show.StartAir;
			EndAir = show.EndAir;
			Poster = show.Poster;
			Thumbnail = show.Thumbnail;
			Logo = show.Logo;
			Type = show.IsMovie ? ItemType.Movie : ItemType.Show;
		}

		/// <summary>
		/// Create a <see cref="LibraryItem"/> from a collection
		/// </summary>
		/// <param name="collection">The collection that this library item should represent.</param>
		public LibraryItem(Collection collection)
		{
			ID = -collection.ID;
			Slug = collection.Slug;
			Title = collection.Name;
			Overview = collection.Overview;
			Status = Models.Status.Unknown;
			StartAir = null;
			EndAir = null;
			Poster = collection.Poster;
			Thumbnail = collection.Thumbnail;
			Logo = collection.Logo;
			Type = ItemType.Collection;
		}

		/// <summary>
		/// An expression to create a <see cref="LibraryItem"/> representing a show.
		/// </summary>
		public static Expression<Func<Show, LibraryItem>> FromShow => x => new LibraryItem
		{
			ID = x.ID,
			Slug = x.Slug,
			Title = x.Title,
			Overview = x.Overview,
			Status = x.Status,
			StartAir = x.StartAir,
			EndAir = x.EndAir,
			Poster = x.Poster,
			Thumbnail = x.Thumbnail,
			Logo = x.Logo,
			Type = x.IsMovie ? ItemType.Movie : ItemType.Show
		};

		/// <summary>
		/// An expression to create a <see cref="LibraryItem"/> representing a collection.
		/// </summary>
		public static Expression<Func<Collection, LibraryItem>> FromCollection => x => new LibraryItem
		{
			ID = -x.ID,
			Slug = x.Slug,
			Title = x.Name,
			Overview = x.Overview,
			Status = Models.Status.Unknown,
			StartAir = null,
			EndAir = null,
			Poster = x.Poster,
			Thumbnail = x.Thumbnail,
			Logo = x.Logo,
			Type = ItemType.Collection
		};

		/// <inheritdoc />
		public override string GetClassName()
		{
			return Type.ToString();
		}
	}
}
