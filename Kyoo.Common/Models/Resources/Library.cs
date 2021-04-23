using System.Collections.Generic;
using System.Linq;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	public class Library : IResource
	{
		public int ID { get; set; }
		public string Slug { get; set; }
		public string Name { get; set; }
		public string[] Paths { get; set; }

		[EditableRelation] [LoadableRelation] public virtual ICollection<Provider> Providers { get; set; }

		[LoadableRelation] public virtual ICollection<Show> Shows { get; set; }
		[LoadableRelation] public virtual ICollection<Collection> Collections { get; set; }

#if ENABLE_INTERNAL_LINKS
		[SerializeIgnore] public virtual ICollection<Link<Library, Provider>> ProviderLinks { get; set; }
		[SerializeIgnore] public virtual ICollection<Link<Library, Show>> ShowLinks { get; set; }
		[SerializeIgnore] public virtual ICollection<Link<Library, Collection>> CollectionLinks { get; set; }
#endif

		public Library()  { }
		
		public Library(string slug, string name, IEnumerable<string> paths, IEnumerable<Provider> providers)
		{
			Slug = slug;
			Name = name;
			Paths = paths?.ToArray();
			Providers = providers?.ToArray();
		}
	}
}
