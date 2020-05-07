using System.Collections.Generic;
using Newtonsoft.Json;

namespace Kyoo.Models
{
	public class Library
	{
		[JsonIgnore] public long ID { get; set; }
		public string Slug { get; set; }
		public string Name { get; set; }
		public string[] Paths { get; set; }
		public virtual IEnumerable<ProviderLink> Providers { get; set; }
		[JsonIgnore] public virtual IEnumerable<Show> Shows { get; set; }
		[JsonIgnore] public virtual IEnumerable<Collection> Collections { get; set; }

		public Library()  { }
		
		public Library(string slug, string name, string[] paths, IEnumerable<ProviderLink> providers)
		{
			Slug = slug;
			Name = name;
			Paths = paths;
			Providers = providers;
		}
	}
}
