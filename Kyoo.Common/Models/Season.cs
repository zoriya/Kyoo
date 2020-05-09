using System.Collections.Generic;
using Newtonsoft.Json;

namespace Kyoo.Models
{
	public class Season
	{
		[JsonIgnore] public long ID  { get; set; }
		[JsonIgnore] public long ShowID { get; set; }

		public long SeasonNumber { get; set; } = -1;

		public string Slug => $"{Show.Title}-s{SeasonNumber}";
		public string Title { get; set; }
		public string Overview { get; set; }
		public long? Year { get; set; }

		[JsonIgnore] public string ImgPrimary { get; set; }
		public virtual IEnumerable<MetadataID> ExternalIDs { get; set; }

		[JsonIgnore] public virtual Show Show { get; set; }
		[JsonIgnore] public virtual IEnumerable<Episode> Episodes { get; set; }

		public Season() { }

		public Season(long showID, 
			long seasonNumber,
			string title, 
			string overview,
			long? year,
			string imgPrimary,
			IEnumerable<MetadataID> externalIDs)
		{
			ShowID = showID;
			SeasonNumber = seasonNumber;
			Title = title;
			Overview = overview;
			Year = year;
			ImgPrimary = imgPrimary;
			ExternalIDs = externalIDs;
		}
	}
}
