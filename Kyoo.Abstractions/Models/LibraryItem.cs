using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using Kyoo.Abstractions.Models.Attributes;

namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// The type of item, ether a show, a movie or a collection.
	/// </summary>
	public enum ItemType
	{
		Show,
		Movie,
		Collection
	}

	/// <summary>
	/// A type union between <see cref="Show"/> and <see cref="Collection"/>.
	/// This is used to list content put inside a library.
	/// </summary>
	public class LibraryItem : IResource, IThumbnails
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
		public Dictionary<int, string> Images { get; set; }

		/// <summary>
		/// The path of this item's poster.
		/// By default, the http path for this poster is returned from the public API.
		/// This can be disabled using the internal query flag.
		/// </summary>
		[SerializeAs("{HOST}/api/{Type:l}/{Slug}/poster")]
		public string Poster => Images?.GetValueOrDefault(Models.Images.Poster);

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
			Images = show.Images;
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
			Images = collection.Images;
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
			Images = x.Images,
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
			Images = x.Images,
			Type = ItemType.Collection
		};
	}
}