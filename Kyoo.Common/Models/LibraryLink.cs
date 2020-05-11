namespace Kyoo.Models
{
	public class LibraryLink
	{
		public long ID { get; set; }
		public long LibraryID { get; set; }
		public virtual Library Library { get; set; }
		public long? ShowID { get; set; }
		public virtual Show Show { get; set; }
		public long? CollectionID { get; set; }
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