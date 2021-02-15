using System.Collections.Generic;
using System.Linq;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	[ComposedSlug]
	public class Season : IResource
	{
		[JsonIgnore] public int ID  { get; set; }
		[JsonIgnore] public int ShowID { get; set; }

		public int SeasonNumber { get; set; } = -1;

		public string Slug => Show != null ? $"{Show.Slug}-s{SeasonNumber}" : ID.ToString();
		public string Title { get; set; }
		public string Overview { get; set; }
		public int? Year { get; set; }

		[JsonIgnore] public string Poster { get; set; }
		[EditableRelation] public virtual ICollection<MetadataID> ExternalIDs { get; set; }

		[JsonIgnore] public virtual Show Show { get; set; }
		[JsonIgnore] public virtual ICollection<Episode> Episodes { get; set; }

		public Season() { }

		public Season(int showID, 
			int seasonNumber,
			string title, 
			string overview,
			int? year,
			string poster,
			IEnumerable<MetadataID> externalIDs)
		{
			ShowID = showID;
			SeasonNumber = seasonNumber;
			Title = title;
			Overview = overview;
			Year = year;
			Poster = poster;
			ExternalIDs = externalIDs?.ToArray();
		}
	}
}
