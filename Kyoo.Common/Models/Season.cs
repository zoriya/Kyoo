using System.Collections.Generic;
using Newtonsoft.Json;

namespace Kyoo.Models
{
	public class Season : IMergable<Season>
	{
		[JsonIgnore] public long ID  { get; set; }
		[JsonIgnore] public long ShowID { get; set; }

		public long SeasonNumber { get; set; } = -1;
		public string Title { get; set; }
		public string Overview { get; set; }
		public long? Year { get; set; }

		[JsonIgnore] public string ImgPrimary { get; set; }
		public string ExternalIDs { get; set; }

		[JsonIgnore] public virtual Show Show { get; set; }
		[JsonIgnore] public virtual IEnumerable<Episode> Episodes { get; set; }

		public Season() { }

		public Season(long showID, long seasonNumber, string title, string overview, long? year, string imgPrimary, string externalIDs)
		{
			ShowID = showID;
			SeasonNumber = seasonNumber;
			Title = title;
			Overview = overview;
			Year = year;
			ImgPrimary = imgPrimary;
			ExternalIDs = externalIDs;
		}

		public Season Merge(Season other)
		{
			if (other == null)
				return this;
			if (ShowID == -1)
				ShowID = other.ShowID;
			if (SeasonNumber == -1)
				SeasonNumber = other.SeasonNumber;
			Title ??= other.Title;
			Overview ??= other.Overview;
			Year ??= other.Year;
			ImgPrimary ??= other.ImgPrimary;
			ExternalIDs = string.Join('|', ExternalIDs, other.ExternalIDs);
			return this;
		}
	}
}
