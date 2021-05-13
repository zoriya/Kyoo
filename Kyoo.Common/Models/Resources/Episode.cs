using System;
using System.Collections.Generic;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	public class Episode : IResource, IOnMerge
	{
		public int ID { get; set; }
		public string Slug => GetSlug(ShowSlug, SeasonNumber, EpisodeNumber, AbsoluteNumber);
		[SerializeIgnore] public string ShowSlug { private get; set; }
		[SerializeIgnore] public int ShowID { get; set; }
		[LoadableRelation(nameof(ShowID))] public virtual Show Show { get; set; }
		[SerializeIgnore] public int? SeasonID { get; set; }
		[LoadableRelation(nameof(SeasonID))] public virtual Season Season { get; set; }

		public int SeasonNumber { get; set; } = -1;
		public int EpisodeNumber { get; set; } = -1;
		public int AbsoluteNumber { get; set; } = -1;
		[SerializeIgnore] public string Path { get; set; }

		[SerializeAs("{HOST}/api/episodes/{Slug}/thumb")] public string Thumb { get; set; }
		public string Title { get; set; }
		public string Overview { get; set; }
		public DateTime? ReleaseDate { get; set; }

		public int Runtime { get; set; } //This runtime variable should be in minutes

		[EditableRelation] [LoadableRelation] public virtual ICollection<MetadataID> ExternalIDs { get; set; }

		[EditableRelation] [LoadableRelation] public virtual ICollection<Track> Tracks { get; set; }
		

		public static string GetSlug(string showSlug, int seasonNumber, int episodeNumber, int absoluteNumber)
		{
			if (showSlug == null)
				throw new ArgumentException("Show's slug is null. Can't find episode's slug.");
			return seasonNumber switch
			{
				-1 when absoluteNumber == -1 => showSlug,
				-1 => $"{showSlug}-{absoluteNumber}",
				_ => $"{showSlug}-s{seasonNumber}e{episodeNumber}"
			};
		}

		public void OnMerge(object merged)
		{
			Episode other = (Episode)merged;
			if (SeasonNumber == -1 && other.SeasonNumber != -1)
				SeasonNumber = other.SeasonNumber;
			if (EpisodeNumber == -1 && other.EpisodeNumber != -1)
				EpisodeNumber = other.EpisodeNumber;
			if (AbsoluteNumber == -1 && other.AbsoluteNumber != -1)
				AbsoluteNumber = other.AbsoluteNumber;
		}
	}
}
