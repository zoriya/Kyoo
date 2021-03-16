using System.Collections.Generic;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	public class ProviderID : IResource
	{
		public int ID { get; set; }
		public string Slug { get; set; }
		public string Name { get; set; }
		[SerializeAs("{HOST}/api/providers/{Slug}/logo")] public string Logo { get; set; }
		
		[LoadableRelation] public virtual ICollection<Library> Libraries { get; set; }
		
#if ENABLE_INTERNAL_LINKS
		[SerializeIgnore] public virtual ICollection<Link<Library, ProviderID>> LibraryLinks { get; set; }
		[SerializeIgnore] public virtual ICollection<MetadataID> MetadataLinks { get; set; }
#endif
		
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