namespace Kyoo.Models
{
	public class CollectionLink
	{
		public int ID { get; set; }
		public int? CollectionID { get; set; }
		public virtual Collection Collection { get; set; }
		public int ShowID { get; set; }
		public virtual Show Show { get; set; }

		public CollectionLink() { }

		public CollectionLink(Collection collection, Show show)
		{
			Collection = collection;
			CollectionID = collection.ID;
			Show = show;
			ShowID = show.ID;
		}
	}
}