using Newtonsoft.Json;

namespace Kyoo.Models
{
	public class ProviderID : IResource
	{
		[JsonIgnore] public int ID { get; set; }
		public string Slug { get; set; }
		public string Name { get; set; }
		public string Logo { get; set; }

		public ProviderID() { }

		public ProviderID(string name, string logo)
		{
			Slug = Utility.ToSlug(name);
			Name = name;
			Logo = logo;
		}
		
		public ProviderID(int id, string name, string logo)
		{
			ID = id;
			Slug = Utility.ToSlug(name);
			Name = name;
			Logo = logo;
		}
	}
}