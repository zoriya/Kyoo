using Newtonsoft.Json;

namespace Kyoo.Models
{
	public class ProviderLink
	{
		[JsonIgnore] public int ID { get; set; }
		[JsonIgnore] public int ProviderID { get; set; }
		[JsonIgnore] public virtual ProviderID Provider { get; set; }
		[JsonIgnore] public int? LibraryID { get; set; }
		[JsonIgnore] public virtual Library Library { get; set; }

		public ProviderLink() { }

		public ProviderLink(ProviderID provider, Library library)
		{
			Provider = provider;
			Library = library;
		}
	}
}