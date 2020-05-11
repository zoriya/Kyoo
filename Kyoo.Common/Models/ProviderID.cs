using Newtonsoft.Json;

namespace Kyoo.Models
{
	public class ProviderID
	{
		[JsonIgnore] public long ID { get; set; }
		public string Name { get; set; }
		public string Logo { get; set; }

		public ProviderID() { }

		public ProviderID(long id, string name, string logo)
		{
			ID = id;
			Name = name;
			Logo = logo;
		}
	}
}