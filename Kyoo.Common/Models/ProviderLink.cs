using Newtonsoft.Json;

namespace Kyoo.Models
{
	public class ProviderLink
	{
		[JsonIgnore] public long ID { get; set; }
		[JsonIgnore] public long ProviderID { get; set; }
		[JsonIgnore] public virtual ProviderID Provider { get; set; }
		[JsonIgnore] public long? ShowID { get; set; }
		[JsonIgnore] public virtual Show Show { get; set; }
		[JsonIgnore] public long? LibraryID { get; set; }
		[JsonIgnore] public virtual Library Library { get; set; }

		public string Name => Provider.Name;
		public string Logo => Provider.Logo;
		
		public ProviderLink() { }
	}
}