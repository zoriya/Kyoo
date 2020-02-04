namespace Kyoo.Models
{
	public class CollectionLink
	{
		public long ID { get; set; }
		public long? CollectionID { get; set; }
		public virtual Collection Collection { get; set; }
		public long ShowID { get; set; }
		public virtual Show Show { get; set; }
	}
}