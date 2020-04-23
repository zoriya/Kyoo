using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;

namespace Kyoo.Models
{
	public class People : IMergable<People>
	{
		public long ID { get; set; }
		public string Slug { get; set; }
		public string Name { get; set; }
		[JsonIgnore] public string ImgPrimary { get; set; }
		public virtual IEnumerable<MetadataID> ExternalIDs { get; set; }
		
		[JsonIgnore] public virtual IEnumerable<PeopleLink> Roles { get; set; }
		
		public People() {}

		public People(string slug, string name, string imgPrimary, IEnumerable<MetadataID> externalIDs)
		{
			Slug = slug;
			Name = name;
			ImgPrimary = imgPrimary;
			ExternalIDs = externalIDs;
		}

		public People Merge(People other)
		{
			if (other == null)
				return this;
			Slug ??= other.Slug;
			Name ??= other.Name;
			ImgPrimary ??= other.ImgPrimary;
			ExternalIDs = Utility.MergeLists(ExternalIDs, other.ExternalIDs,
				(x, y) => x.Provider.Name == y.Provider.Name);
			return this;
		}
	}
}
