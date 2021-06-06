using System;
using System.Collections.Generic;
using JetBrains.Annotations;
using Kyoo.Controllers;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	/// <summary>
	/// A class to represent a single show's episode.
	/// This is also used internally for movies (their number is juste set to -1).
	/// </summary>
	public class Episode : IResource, IOnMerge
	{
		/// <inheritdoc />
		public int ID { get; set; }
		
		/// <inheritdoc />
		public string Slug => GetSlug(ShowSlug, SeasonNumber, EpisodeNumber, AbsoluteNumber);
		
		/// <summary>
		/// The slug of the Show that contain this episode. If this is not set, this episode is ill-formed.
		/// </summary>
		[SerializeIgnore] public string ShowSlug { private get; set; }
		
		/// <summary>
		/// The ID of the Show containing this episode. This value is only set when the <see cref="Show"/> has been loaded.
		/// </summary>
		[SerializeIgnore] public int ShowID { get; set; }
		/// <summary>
		/// The show that contains this episode. This must be explicitly loaded via a call to <see cref="ILibraryManager.Load"/>.
		/// </summary>
		[LoadableRelation(nameof(ShowID))] public Show Show { get; set; }
		
		/// <summary>
		/// The ID of the Season containing this episode. This value is only set when the <see cref="Season"/> has been loaded.
		/// </summary>
		[SerializeIgnore] public int? SeasonID { get; set; }
		/// <summary>
		/// The season that contains this episode. This must be explicitly loaded via a call to <see cref="ILibraryManager.Load"/>.
		/// This can be null if the season is unknown and the episode is only identified by it's <see cref="AbsoluteNumber"/>.
		/// </summary>
		[LoadableRelation(nameof(SeasonID))] public Season Season { get; set; }

		/// <summary>
		/// The season in witch this episode is in. This defaults to -1 if not specified.
		/// </summary>
		public int SeasonNumber { get; set; } = -1;
		
		/// <summary>
		/// The number of this episode is it's season. This defaults to -1 if not specified.
		/// </summary>
		public int EpisodeNumber { get; set; } = -1;
		
		/// <summary>
		/// The absolute number of this episode. It's an episode number that is not reset to 1 after a new season.
		/// This defaults to -1 if not specified.
		/// </summary>
		public int AbsoluteNumber { get; set; } = -1;
		
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
		/// If this is a movie or if the episode should be referred by it's absolute number, set this to -1.
		/// </param>
		/// <param name="episodeNumber">
		/// The number of the episode in it's season.
		/// If this is a movie or if the episode should be referred by it's absolute number, set this to -1.
		/// </param>
		/// <param name="absoluteNumber">
		/// The absolute number of this show.
		/// If you don't know it or this is a movie, use -1
		/// </param>
		/// <returns>The slug corresponding to the given arguments</returns>
		/// <exception cref="ArgumentNullException">The given show slug was null.</exception>
		public static string GetSlug([NotNull] string showSlug, 
			int seasonNumber = -1, 
			int episodeNumber = -1,
			int absoluteNumber = -1)
		{
			if (showSlug == null)
				throw new ArgumentNullException(nameof(showSlug));
			return seasonNumber switch
			{
				-1 when absoluteNumber == -1 => showSlug,
				-1 => $"{showSlug}-{absoluteNumber}",
				_ => $"{showSlug}-s{seasonNumber}e{episodeNumber}"
			};
		}

		/// <inheritdoc />
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
