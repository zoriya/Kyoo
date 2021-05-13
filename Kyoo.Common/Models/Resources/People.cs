using System.Collections.Generic;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	public class People : IResource
	{
		public int ID { get; set; }
		public string Slug { get; set; }
		public string Name { get; set; }
		[SerializeAs("{HOST}/api/people/{Slug}/poster")] public string Poster { get; set; }
		[EditableRelation] [LoadableRelation] public virtual ICollection<MetadataID> ExternalIDs { get; set; }
		
		[EditableRelation] [LoadableRelation] public virtual ICollection<PeopleRole> Roles { get; set; }
	}
}
