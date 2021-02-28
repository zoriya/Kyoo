using System.Collections.Generic;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	public class ProviderID : IResource
	{
		public int ID { get; set; }
		public string Slug { get; set; }
		public string Name { get; set; }
		public string Logo { get; set; }
		
		[LoadableRelation] public ICollection<Library> Libraries { get; set; }

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