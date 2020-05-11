using Newtonsoft.Json;

namespace Kyoo.Models
{
	public class ProviderLink
	{
		[JsonIgnore] public long ID { get; set; }
		[JsonIgnore] public long ProviderID { get; set; }
		[JsonIgnore] public virtual ProviderID Provider { get; set; }
		[JsonIgnore] public long? LibraryID { get; set; }
		[JsonIgnore] public virtual Library Library { get; set; }

		public ProviderLink() { }

		public ProviderLink(ProviderID provider, Library library)
		{
			Provider = provider;
			Library = library;
		}
	}
}