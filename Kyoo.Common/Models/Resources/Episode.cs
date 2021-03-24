using System;
using System.Collections.Generic;
using System.Linq;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	public class Episode : IResource, IOnMerge
	{
		public int ID { get; set; }
		public string Slug => GetSlug(ShowSlug, SeasonNumber, EpisodeNumber);
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
		

		public Episode() { }

		public Episode(int seasonNumber, 
			int episodeNumber,
			int absoluteNumber,
			string title,
			string overview,
			DateTime? releaseDate,
			int runtime,
			string thumb,
			IEnumerable<MetadataID> externalIDs)
		{
			SeasonNumber = seasonNumber;
			EpisodeNumber = episodeNumber;
			AbsoluteNumber = absoluteNumber;
			Title = title;
			Overview = overview;
			ReleaseDate = releaseDate;
			Runtime = runtime;
			Thumb = thumb;
			ExternalIDs = externalIDs?.ToArray();
		}

		public Episode(int showID, 
			int seasonID,
			int seasonNumber, 
			int episodeNumber, 
			int absoluteNumber, 
			string path,
			string title, 
			string overview, 
			DateTime? releaseDate, 
			int runtime, 
			string poster,
			IEnumerable<MetadataID> externalIDs)
			: this(seasonNumber, episodeNumber, absoluteNumber, title, overview, releaseDate, runtime, poster, externalIDs)
		{
			ShowID = showID;
			SeasonID = seasonID;
			Path = path;
		}

		public static string GetSlug(string showSlug, int seasonNumber, int episodeNumber)
		{
			if (showSlug == null)
				throw new ArgumentException("Show's slug is null. Can't find episode's slug.");
			if (seasonNumber == -1)
				return showSlug;
			return $"{showSlug}-s{seasonNumber}e{episodeNumber}";
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
