using System;
using System.Collections.Generic;
using Kyoo.Abstractions.Models.Attributes;

namespace Kyoo.Abstractions.Models
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
		[Obsolete("Use Images instead of this, this is only kept for the API response.")]
		public string Poster => Images?.GetValueOrDefault(Models.Images.Poster);

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
	}
}
