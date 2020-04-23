namespace Kyoo.Models
{
	public class ProviderLink
	{
		public long ID { get; set; }
		public long ProviderID { get; set; }
		public virtual ProviderID Provider { get; set; }
		public long? ShowID { get; set; }
		public virtual Show Show { get; set; }
		public long? LibraryID { get; set; }
		public virtual Library Library { get; set; }

		public string Name => Provider.Name;
		
		public ProviderLink() { }
	}
}