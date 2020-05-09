using Newtonsoft.Json;
using System;
using System.Collections.Generic;

namespace Kyoo.Models
{
	public class Episode
	{
		[JsonIgnore] public long ID { get; set; }
		[JsonIgnore] public long ShowID { get; set; }
		[JsonIgnore] public virtual Show Show { get; set; }
		[JsonIgnore] public long? SeasonID { get; set; }
		[JsonIgnore] public virtual Season Season { get; set; }

		public long SeasonNumber { get; set; }
		public long EpisodeNumber { get; set; }
		public long AbsoluteNumber { get; set; }
		[JsonIgnore] public string Path { get; set; }
		public string Title { get; set; }
		public string Overview { get; set; }
		public DateTime? ReleaseDate { get; set; }

		public long Runtime { get; set; } //This runtime variable should be in minutes

		[JsonIgnore] public string ImgPrimary { get; set; }
		public virtual IEnumerable<MetadataID> ExternalIDs { get; set; }

		[JsonIgnore] public virtual IEnumerable<Track> Tracks { get; set; }

		public string ShowTitle => Show.Title; // Used in the API response only
		public string Slug => GetSlug(Show.Slug, SeasonNumber, EpisodeNumber);
		public string Thumb
		{
			get
			{
				if (Show != null)
					return "thumb/" + Slug;
				return ImgPrimary;
			}
		}


		public Episode() { }

		public Episode(long seasonNumber, 
			long episodeNumber,
			long absoluteNumber,
			string title,
			string overview,
			DateTime? releaseDate,
			long runtime,
			string imgPrimary,
			IEnumerable<MetadataID> externalIDs)
		{
			SeasonNumber = seasonNumber;
			EpisodeNumber = episodeNumber;
			AbsoluteNumber = absoluteNumber;
			Title = title;
			Overview = overview;
			ReleaseDate = releaseDate;
			Runtime = runtime;
			ImgPrimary = imgPrimary;
			ExternalIDs = externalIDs;
		}

		public Episode(long showID, 
			long seasonID,
			long seasonNumber, 
			long episodeNumber, 
			long absoluteNumber, 
			string path,
			string title, 
			string overview, 
			DateTime? releaseDate, 
			long runtime, 
			string imgPrimary,
			IEnumerable<MetadataID> externalIDs)
		{
			ShowID = showID;
			SeasonID = seasonID;
			SeasonNumber = seasonNumber;
			EpisodeNumber = episodeNumber;
			AbsoluteNumber = absoluteNumber;
			Path = path;
			Title = title;
			Overview = overview;
			ReleaseDate = releaseDate;
			Runtime = runtime;
			ImgPrimary = imgPrimary;
			ExternalIDs = externalIDs;
		}

		public static string GetSlug(string showSlug, long seasonNumber, long episodeNumber)
		{
			return showSlug + "-s" + seasonNumber + "e" + episodeNumber;
		}
	}
}
