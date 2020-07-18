using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;

namespace Kyoo.Models
{
	public class People : IRessource
	{
		public int ID { get; set; }
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
	}
}
