using System;
using System.Collections.Generic;
using System.Linq;
using JetBrains.Annotations;
using Kyoo.Common.Models.Attributes;
using Kyoo.Controllers;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	/// <summary>
	/// A series or a movie.
	/// </summary>
	public class Show : IResource, IOnMerge
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
		public string TrailerUrl { get; set; }
		
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

		/// <summary>
		/// The path of this show's poster.
		/// By default, the http path for this poster is returned from the public API.
		/// This can be disabled using the internal query flag.
		/// </summary>
		[SerializeAs("{HOST}/api/shows/{Slug}/poster")] public string Poster { get; set; }
		
		/// <summary>
		/// The path of this show's logo.
		/// By default, the http path for this logo is returned from the public API.
		/// This can be disabled using the internal query flag.
		/// </summary>
		[SerializeAs("{HOST}/api/shows/{Slug}/logo")] public string Logo { get; set; }
		
		/// <summary>
		/// The path of this show's backdrop.
		/// By default, the http path for this backdrop is returned from the public API.
		/// This can be disabled using the internal query flag.
		/// </summary>
		[SerializeAs("{HOST}/api/shows/{Slug}/backdrop")] public string Backdrop { get; set; }

		/// <summary>
		/// True if this show represent a movie, false otherwise.
		/// </summary>
		public bool IsMovie { get; set; }

		/// <summary>
		/// The link to metadata providers that this show has. See <see cref="MetadataID{T}"/> for more information.
		/// </summary>
		[EditableRelation] [LoadableRelation] public ICollection<MetadataID<Show>> ExternalIDs { get; set; }
		
		/// <summary>
		/// The ID of the Studio that made this show.
		/// </summary>
		[SerializeIgnore] public int? StudioID { get; set; }
		/// <summary>
		/// The Studio that made this show. This must be explicitly loaded via a call to <see cref="ILibraryManager.Load"/>.
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
		
#if ENABLE_INTERNAL_LINKS
		/// <summary>
		/// The internal link between this show and libraries in the <see cref="Libraries"/> list.
		/// </summary>
		[Link] public ICollection<Link<Library, Show>> LibraryLinks { get; set; }
		
		/// <summary>
		/// The internal link between this show and collections in the <see cref="Collections"/> list.
		/// </summary>
		[Link] public ICollection<Link<Collection, Show>> CollectionLinks { get; set; }
		
		/// <summary>
		/// The internal link between this show and genres in the <see cref="Genres"/> list.
		/// </summary>
		[Link] public ICollection<Link<Show, Genre>> GenreLinks { get; set; }
#endif

		/// <summary>
		/// Retrieve the internal provider's ID of a show using it's provider slug. 
		/// </summary>
		/// <remarks>This method will never return anything if the <see cref="ExternalIDs"/> are not loaded.</remarks>
		/// <param name="provider">The slug of the provider</param>
		/// <returns>The <see cref="MetadataID{T}.DataID"/> field of the asked provider.</returns>
		[CanBeNull]
		public string GetID(string provider)
		{
			return ExternalIDs?.FirstOrDefault(x => x.Second.Slug == provider)?.DataID;
		}

		/// <inheritdoc />
		public void OnMerge(object merged)
		{
			if (ExternalIDs != null)
				foreach (MetadataID<Show> id in ExternalIDs)
					id.First = this;
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
	public enum Status { Finished, Airing, Planned, Unknown }
}
