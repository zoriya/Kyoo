using System.Collections.Generic;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	public class Library : IResource
	{
		[JsonIgnore] public int ID { get; set; }
		public string Slug { get; set; }
		public string Name { get; set; }
		public IEnumerable<string> Paths { get; set; }

		[EditableRelation] public virtual IEnumerable<ProviderID> Providers { get; set; }

		[JsonIgnore] public virtual IEnumerable<Show> Shows { get; set; }
		[JsonIgnore] public virtual IEnumerable<Collection> Collections { get; set; }

		public Library()  { }
		
		public Library(string slug, string name, IEnumerable<string> paths, IEnumerable<ProviderID> providers)
		{
			Slug = slug;
			Name = name;
			Paths = paths;
			Providers = providers;
		}
	}
}
