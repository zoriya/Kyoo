using System.Collections.Generic;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Utils;

namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// A studio that make shows.
	/// </summary>
	public class Studio : IResource, IMetadata
	{
		/// <inheritdoc />
		public int ID { get; set; }

		/// <inheritdoc />
		public string Slug { get; set; }

		/// <summary>
		/// The name of this studio.
		/// </summary>
		public string Name { get; set; }

		/// <summary>
		/// The list of shows that are made by this studio.
		/// </summary>
		[LoadableRelation] public ICollection<Show> Shows { get; set; }

		/// <inheritdoc />
		[EditableRelation] [LoadableRelation] public ICollection<MetadataID> ExternalIDs { get; set; }

		/// <summary>
		/// Create a new, empty, <see cref="Studio"/>.
		/// </summary>
		public Studio() { }

		/// <summary>
		/// Create a new <see cref="Studio"/> with a specific name, the slug is calculated automatically.
		/// </summary>
		/// <param name="name">The name of the studio.</param>
		public Studio(string name)
		{
			Slug = Utility.ToSlug(name);
			Name = name;
		}
	}
}
