using System;
using System.Linq.Expressions;
using JetBrains.Annotations;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
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
	public class LibraryItem : IResource
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
		
		/// <summary>
		/// The path of this item's poster.
		/// By default, the http path for this poster is returned from the public API.
		/// This can be disabled using the internal query flag.
		/// </summary>
		[SerializeAs("{HOST}/api/{_type}/{Slug}/poster")] public string Poster { get; set; }
		[UsedImplicitly] private string _type => Type == ItemType.Collection ? "collection" : "show";
		public ItemType Type { get; set; }
		
		public LibraryItem() {}

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
			Type = show.IsMovie ? ItemType.Movie : ItemType.Show;
		}
		
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
			Type = ItemType.Collection;
		}

		public static Expression<Func<Show, LibraryItem>> FromShow => x => new LibraryItem
		{
			ID = x.ID,
			Slug = x.Slug,
			Title = x.Title,
			Overview = x.Overview,
			Status = x.Status,
			StartAir = x.StartAir,
			EndAir = x.EndAir,
			Poster= x.Poster,
			Type = x.IsMovie ? ItemType.Movie : ItemType.Show
		};
		
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
			Type = ItemType.Collection
		};
	}
}