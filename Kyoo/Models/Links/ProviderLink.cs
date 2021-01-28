using Newtonsoft.Json;

namespace Kyoo.Models
{
	public class ProviderLink : IResourceLink<Library, ProviderID>
	{
		[JsonIgnore] public int ParentID { get; set; }
		[JsonIgnore] public virtual Library Parent { get; set; }
		[JsonIgnore] public int ChildID { get; set; }
		[JsonIgnore] public virtual ProviderID Child { get; set; }

		public ProviderLink() { }

		public ProviderLink(ProviderID child, Library parent)
		{
			Child = child;
			Parent = parent;
		}
	}
}