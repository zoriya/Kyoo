using System.Collections.Generic;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	public class Season : IResource
	{
		public int ID  { get; set; }
		public string Slug => $"{ShowSlug}-s{SeasonNumber}";
		[SerializeIgnore] public int ShowID { get; set; }
		[SerializeIgnore] public string ShowSlug { private get; set; }
		[LoadableRelation(nameof(ShowID))] public virtual Show Show { get; set; }

		public int SeasonNumber { get; set; } = -1;

		public string Title { get; set; }
		public string Overview { get; set; }
		public int? Year { get; set; }

		[SerializeAs("{HOST}/api/seasons/{Slug}/thumb")] public string Poster { get; set; }
		[EditableRelation] [LoadableRelation] public virtual ICollection<MetadataID> ExternalIDs { get; set; }

		[LoadableRelation] public virtual ICollection<Episode> Episodes { get; set; }
	}
}
