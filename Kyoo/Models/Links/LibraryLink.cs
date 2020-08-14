namespace Kyoo.Models
{
	public class LibraryLink
	{
		public int ID { get; set; }
		public int LibraryID { get; set; }
		public virtual Library Library { get; set; }
		public int? ShowID { get; set; }
		public virtual Show Show { get; set; }
		public int? CollectionID { get; set; }
		public virtual Collection Collection { get; set; }

		public LibraryLink() { }

		public LibraryLink(Library library, Show show)
		{
			Library = library;
			Show = show;
		}

		public LibraryLink(Library library, Collection collection)
		{
			Library = library;
			Collection = collection;
		}
	}
}