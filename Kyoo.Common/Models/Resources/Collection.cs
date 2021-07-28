using System.Collections.Generic;
using Kyoo.Common.Models.Attributes;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	/// <summary>
	/// A class representing collections of <see cref="Show"/>.
	/// A collection can also be stored in a <see cref="Library"/>.
	/// </summary>
	public class Collection : IResource, IMetadata, IThumbnails
	{
		/// <inheritdoc />
		public int ID { get; set; }
		
		/// <inheritdoc />
		public string Slug { get; set; }
		
		/// <summary>
		/// The name of this collection.
		/// </summary>
		public string Name { get; set; }

		/// <inheritdoc />
		public Dictionary<int, string> Images { get; set; }
		
		/// <summary>
		/// The path of this poster.
		/// By default, the http path for this poster is returned from the public API.
		/// This can be disabled using the internal query flag.
		/// </summary>
		[SerializeAs("{HOST}/api/collection/{Slug}/poster")]
		public string Poster => Images?.GetValueOrDefault(Thumbnails.Poster);

		/// <summary>
		/// The description of this collection.
		/// </summary>
		public string Overview { get; set; }
		
		/// <summary>
		/// The list of shows contained in this collection.
		/// </summary>
		[LoadableRelation] public ICollection<Show> Shows { get; set; }
		
		/// <summary>
		/// The list of libraries that contains this collection.
		/// </summary>
		[LoadableRelation] public ICollection<Library> Libraries { get; set; }
		
		/// <inheritdoc />
		[EditableRelation] [LoadableRelation] public ICollection<MetadataID> ExternalIDs { get; set; }

#if ENABLE_INTERNAL_LINKS
		
		/// <summary>
		/// The internal link between this collection and shows in the <see cref="Shows"/> list.
		/// </summary>
		[Link] public ICollection<Link<Collection, Show>> ShowLinks { get; set; }
		
		/// <summary>
		/// The internal link between this collection and libraries in the <see cref="Libraries"/> list.
		/// </summary>
		[Link] public ICollection<Link<Library, Collection>> LibraryLinks { get; set; }
#endif
	}
}
