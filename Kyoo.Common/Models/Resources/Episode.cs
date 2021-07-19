using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using JetBrains.Annotations;
using Kyoo.Controllers;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	/// <summary>
	/// A class to represent a single show's episode.
	/// </summary>
	public class Episode : IResource
	{
		/// <inheritdoc />
		public int ID { get; set; }

		/// <inheritdoc />
		[Computed] public string Slug
		{
			get
			{
				if (ShowSlug != null || Show != null)
					return GetSlug(ShowSlug ?? Show.Slug, SeasonNumber, EpisodeNumber, AbsoluteNumber);
				return ShowID != 0 
					? GetSlug(ShowID.ToString(), SeasonNumber, EpisodeNumber, AbsoluteNumber) 
					: null;
			}
			[UsedImplicitly] [NotNull] private set
			{
				if (value == null)
					throw new ArgumentNullException(nameof(value));
				
				Match match = Regex.Match(value, @"(?<show>.+)-s(?<season>\d+)e(?<episode>\d+)");

				if (match.Success)
				{
					ShowSlug = match.Groups["show"].Value;
					SeasonNumber = int.Parse(match.Groups["season"].Value);
					EpisodeNumber = int.Parse(match.Groups["episode"].Value);
				}
				else
				{
					match = Regex.Match(value, @"(?<show>.+)-(?<absolute>\d+)");
					if (match.Success)
					{
						ShowSlug = match.Groups["show"].Value;
						AbsoluteNumber = int.Parse(match.Groups["absolute"].Value);
					}
					else
						ShowSlug = value;
					SeasonNumber = null;
					EpisodeNumber = null;
				}
			}
		}

		/// <summary>
		/// The slug of the Show that contain this episode. If this is not set, this episode is ill-formed.
		/// </summary>
		[SerializeIgnore] public string ShowSlug { private get; set; }
		
		/// <summary>
		/// The ID of the Show containing this episode.
		/// </summary>
		[SerializeIgnore] public int ShowID { get; set; }
		/// <summary>
		/// The show that contains this episode. This must be explicitly loaded via a call to <see cref="ILibraryManager.Load"/>.
		/// </summary>
		[LoadableRelation(nameof(ShowID))] public Show Show { get; set; }
		
		/// <summary>
		/// The ID of the Season containing this episode.
		/// </summary>
		[SerializeIgnore] public int? SeasonID { get; set; }
		/// <summary>
		/// The season that contains this episode. This must be explicitly loaded via a call to <see cref="ILibraryManager.Load"/>.
		/// This can be null if the season is unknown and the episode is only identified by it's <see cref="AbsoluteNumber"/>.
		/// </summary>
		[LoadableRelation(nameof(SeasonID))] public Season Season { get; set; }

		/// <summary>
		/// The season in witch this episode is in.
		/// </summary>
		public int? SeasonNumber { get; set; }
		
		/// <summary>
		/// The number of this episode is it's season.
		/// </summary>
		public int? EpisodeNumber { get; set; }
		
		/// <summary>
		/// The absolute number of this episode. It's an episode number that is not reset to 1 after a new season.
		/// </summary>
		public int? AbsoluteNumber { get; set; }
		
		/// <summary>
		/// The path of the video file for this episode. Any format supported by a <see cref="IFileManager"/> is allowed.
		/// </summary>
		[SerializeIgnore] public string Path { get; set; }

		/// <summary>
		/// The path of this episode's thumbnail.
		/// By default, the http path for the thumbnail is returned from the public API.
		/// This can be disabled using the internal query flag.
		/// </summary>
		[SerializeAs("{HOST}/api/episodes/{Slug}/thumb")] public string Thumb { get; set; }
		
		/// <summary>
		/// The title of this episode.
		/// </summary>
		public string Title { get; set; }
		
		/// <summary>
		/// The overview of this episode.
		/// </summary>
		public string Overview { get; set; }
		
		/// <summary>
		/// The release date of this episode. It can be null if unknown.
		/// </summary>
		public DateTime? ReleaseDate { get; set; }

		/// <summary>
		/// The link to metadata providers that this episode has. See <see cref="MetadataID{T}"/> for more information.
		/// </summary>
		[EditableRelation] [LoadableRelation] public ICollection<MetadataID<Episode>> ExternalIDs { get; set; }

		/// <summary>
		/// The list of tracks this episode has. This lists video, audio and subtitles available.
		/// </summary>
		[EditableRelation] [LoadableRelation] public ICollection<Track> Tracks { get; set; }
		

		/// <summary>
		/// Get the slug of an episode.
		/// </summary>
		/// <param name="showSlug">The slug of the show. It can't be null.</param>
		/// <param name="seasonNumber">
		/// The season in which the episode is.
		/// If this is a movie or if the episode should be referred by it's absolute number, set this to null.
		/// </param>
		/// <param name="episodeNumber">
		/// The number of the episode in it's season.
		/// If this is a movie or if the episode should be referred by it's absolute number, set this to null.
		/// </param>
		/// <param name="absoluteNumber">
		/// The absolute number of this show.
		/// If you don't know it or this is a movie, use null
		/// </param>
		/// <returns>The slug corresponding to the given arguments</returns>
		/// <exception cref="ArgumentNullException">The given show slug was null.</exception>
		public static string GetSlug([NotNull] string showSlug, 
			int? seasonNumber, 
			int? episodeNumber,
			int? absoluteNumber = null)
		{
			if (showSlug == null)
				throw new ArgumentNullException(nameof(showSlug));
			return seasonNumber switch
			{
				null when absoluteNumber == null => showSlug,
				null => $"{showSlug}-{absoluteNumber}",
				_ => $"{showSlug}-s{seasonNumber}e{episodeNumber}"
			};
		}
	}
}
