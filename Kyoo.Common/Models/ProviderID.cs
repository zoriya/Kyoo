using Newtonsoft.Json;

namespace Kyoo.Models
{
	public class ProviderID
	{
		[JsonIgnore] public int ID { get; set; }
		public string Name { get; set; }
		public string Logo { get; set; }

		public ProviderID() { }

		public ProviderID(int id, string name, string logo)
		{
			ID = id;
			Name = name;
			Logo = logo;
		}
	}
}