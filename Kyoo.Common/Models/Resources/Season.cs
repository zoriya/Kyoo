﻿using System.Collections.Generic;
using System.Linq;
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

		[SerializeIgnore] public string Poster { get; set; }
		public string Thumb => $"/api/seasons/{Slug}/thumb";
		[EditableRelation] [LoadableRelation] public virtual ICollection<MetadataID> ExternalIDs { get; set; }

		[LoadableRelation] public virtual ICollection<Episode> Episodes { get; set; }

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
