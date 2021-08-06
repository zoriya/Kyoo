using System;
using System.Collections.Generic;
using Kyoo.Controllers;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	/// <summary>
	/// A series or a movie.
	/// </summary>
	public class Show : IResource, IMetadata, IOnMerge, IThumbnails
	{
		/// <inheritdoc />
		public int ID { get; set; }
		
		/// <inheritdoc />
		public string Slug { get; set; }
		
		/// <summary>
		/// The title of this show.
		/// </summary>
		public string Title { get; set; }
		
		/// <summary>
		/// The list of alternative titles of this show.
		/// </summary>
		[EditableRelation] public string[] Aliases { get; set; }
		
		/// <summary>
		/// The path of the root directory of this show.
		/// This can be any kind of path supported by <see cref="IFileSystem"/>
		/// </summary>
		[SerializeIgnore] public string Path { get; set; }
		
		/// <summary>
		/// The summary of this show.
		/// </summary>
		public string Overview { get; set; }
		
		/// <summary>
		/// Is this show airing, not aired yet or finished?
		/// </summary>
		public Status Status { get; set; }

		/// <summary>
		/// An URL to a trailer. This could be any path supported by the <see cref="IFileSystem"/>.
		/// </summary>
		/// TODO for now, this is set to a youtube url. It should be cached and converted to a local file.
		[Obsolete("Use Images instead of this, this is only kept for the API response.")]
		public string TrailerUrl => Images?.GetValueOrDefault(Models.Images.Trailer);
		
		/// <summary>
		/// The date this show started airing. It can be null if this is unknown. 
		/// </summary>
		public DateTime? StartAir { get; set; }
		
		/// <summary>
		/// The date this show finished airing.
		/// It must be after the <see cref="StartAir"/> but can be the same (example: for movies).
		/// It can also be null if this is unknown.
		/// </summary>
		public DateTime? EndAir { get; set; }

		/// <inheritdoc />
		public Dictionary<int, string> Images { get; set; }

		/// <summary>
		/// The path of this show's poster.
		/// By default, the http path for this poster is returned from the public API.
		/// This can be disabled using the internal query flag.
		/// </summary>
		[SerializeAs("{HOST}/api/shows/{Slug}/poster")]
		[Obsolete("Use Images instead of this, this is only kept for the API response.")]
		public string Poster => Images?.GetValueOrDefault(Models.Images.Poster);

		/// <summary>
		/// The path of this show's logo.
		/// By default, the http path for this logo is returned from the public API.
		/// This can be disabled using the internal query flag.
		/// </summary>
		[SerializeAs("{HOST}/api/shows/{Slug}/logo")]
		[Obsolete("Use Images instead of this, this is only kept for the API response.")]
		public string Logo => Images?.GetValueOrDefault(Models.Images.Logo);

		/// <summary>
		/// The path of this show's backdrop.
		/// By default, the http path for this backdrop is returned from the public API.
		/// This can be disabled using the internal query flag.
		/// </summary>
		[SerializeAs("{HOST}/api/shows/{Slug}/backdrop")]
		[Obsolete("Use Images instead of this, this is only kept for the API response.")]
		public string Backdrop => Images?.GetValueOrDefault(Models.Images.Thumbnail);

		/// <summary>
		/// True if this show represent a movie, false otherwise.
		/// </summary>
		public bool IsMovie { get; set; }

		/// <inheritdoc />
		[EditableRelation] [LoadableRelation] public ICollection<MetadataID> ExternalIDs { get; set; }

		/// <summary>
		/// The ID of the Studio that made this show.
		/// </summary>
		[SerializeIgnore] public int? StudioID { get; set; }
		/// <summary>
		/// The Studio that made this show.
		/// This must be explicitly loaded via a call to <see cref="ILibraryManager.Load"/>.
		/// </summary>
		[LoadableRelation(nameof(StudioID))] [EditableRelation] public Studio Studio { get; set; }
		
		/// <summary>
		/// The list of genres (themes) this show has.
		/// </summary>
		[LoadableRelation] [EditableRelation] public ICollection<Genre> Genres { get; set; }
		
		/// <summary>
		/// The list of people that made this show.
		/// </summary>
		[LoadableRelation] [EditableRelation] public ICollection<PeopleRole> People { get; set; }
		
		/// <summary>
		/// The different seasons in this show. If this is a movie, this list is always null or empty.
		/// </summary>
		[LoadableRelation] public ICollection<Season> Seasons { get; set; }
		
		/// <summary>
		/// The list of episodes in this show.
		/// If this is a movie, there will be a unique episode (with the seasonNumber and episodeNumber set to null).
		/// Having an episode is necessary to store metadata and tracks.
		/// </summary>
		[LoadableRelation] public ICollection<Episode> Episodes { get; set; }
		
		/// <summary>
		/// The list of libraries that contains this show.
		/// </summary>
		[LoadableRelation] public ICollection<Library> Libraries { get; set; }
		
		/// <summary>
		/// The list of collections that contains this show.
		/// </summary>
		[LoadableRelation] public ICollection<Collection> Collections { get; set; }
		
		/// <inheritdoc />
		public void OnMerge(object merged)
		{
			if (People != null)
				foreach (PeopleRole link in People)
					link.Show = this;
			if (Seasons != null)
				foreach (Season season in Seasons)
					season.Show = this;
			if (Episodes != null)
				foreach (Episode episode in Episodes)
					episode.Show = this;
		}
	}

	/// <summary>
	/// The enum containing show's status.
	/// </summary>
	public enum Status { Unknown, Finished, Airing, Planned }
}
