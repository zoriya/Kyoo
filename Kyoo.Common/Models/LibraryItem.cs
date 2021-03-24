using System;
using System.Linq.Expressions;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	public enum ItemType
	{
		Show,
		Movie,
		Collection
	}
	
	public class LibraryItem : IResource
	{
		public int ID { get; set; }
		public string Slug { get; set; }
		public string Title { get; set; }
		public string Overview { get; set; }
		public Status? Status { get; set; }
		public string TrailerUrl { get; set; }
		public int? StartYear { get; set; }
		public int? EndYear { get; set; }
		[SerializeAs("{HOST}/api/{_type}/{Slug}/poster")] public string Poster { get; set; }
		private string _type => Type == ItemType.Collection ? "collection" : "show";
		public ItemType Type { get; set; }
		
		public LibraryItem() {}

		public LibraryItem(Show show)
		{
			ID = show.ID;
			Slug = show.Slug;
			Title = show.Title;
			Overview = show.Overview;
			Status = show.Status;
			TrailerUrl = show.TrailerUrl;
			StartYear = show.StartYear;
			EndYear = show.EndYear;
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
			TrailerUrl = null;
			StartYear = null;
			EndYear = null;
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
			TrailerUrl = x.TrailerUrl,
			StartYear = x.StartYear,
			EndYear = x.EndYear,
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
			TrailerUrl = null,
			StartYear = null,
			EndYear = null,
			Poster= x.Poster,
			Type = ItemType.Collection
		};
	}
}