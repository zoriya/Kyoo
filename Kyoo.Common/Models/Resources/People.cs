using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;

namespace Kyoo.Models
{
	public class People : IResource
	{
		public int ID { get; set; }
		public string Slug { get; set; }
		public string Name { get; set; }
		public string Poster { get; set; }
		public virtual IEnumerable<MetadataID> ExternalIDs { get; set; }
		
		[JsonIgnore] public virtual IEnumerable<PeopleRole> Roles { get; set; }
		
		public People() {}

		public People(string slug, string name, string poster, IEnumerable<MetadataID> externalIDs)
		{
			Slug = slug;
			Name = name;
			Poster = poster;
			ExternalIDs = externalIDs;
		}
	}
}
