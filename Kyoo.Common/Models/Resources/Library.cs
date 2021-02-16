using System.Collections.Generic;
using System.Linq;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	public class Library : IResource
	{
		[JsonIgnore] public int ID { get; set; }
		public string Slug { get; set; }
		public string Name { get; set; }
		public string[] Paths { get; set; }

		[EditableRelation] public virtual ICollection<ProviderID> Providers { get; set; }

		[JsonIgnore] public virtual ICollection<Show> Shows { get; set; }
		[JsonIgnore] public virtual ICollection<Collection> Collections { get; set; }

		public Library()  { }
		
		public Library(string slug, string name, IEnumerable<string> paths, IEnumerable<ProviderID> providers)
		{
			Slug = slug;
			Name = name;
			Paths = paths?.ToArray();
			Providers = providers?.ToArray();
		}
	}
}
