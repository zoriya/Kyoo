using System.Collections.Generic;
using Newtonsoft.Json;

namespace Kyoo.Models
{
	public class Season
	{
		[JsonIgnore] public int ID  { get; set; }
		[JsonIgnore] public int ShowID { get; set; }

		public int SeasonNumber { get; set; } = -1;

		public string Slug => $"{Show.Slug}-s{SeasonNumber}";
		public string Title { get; set; }
		public string Overview { get; set; }
		public int? Year { get; set; }

		[JsonIgnore] public string ImgPrimary { get; set; }
		public virtual IEnumerable<MetadataID> ExternalIDs { get; set; }

		[JsonIgnore] public virtual Show Show { get; set; }
		[JsonIgnore] public virtual IEnumerable<Episode> Episodes { get; set; }

		public Season() { }

		public Season(int showID, 
			int seasonNumber,
			string title, 
			string overview,
			int? year,
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
