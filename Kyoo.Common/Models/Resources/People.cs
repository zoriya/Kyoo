using System.Collections.Generic;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	/// <summary>
	/// An actor, voice actor, writer, animator, somebody who worked on a <see cref="Show"/>. 
	/// </summary>
	public class People : IResource, IMetadata
	{
		/// <inheritdoc />
		public int ID { get; set; }
		
		/// <inheritdoc />
		public string Slug { get; set; }
		
		/// <summary>
		/// The name of this person.
		/// </summary>
		public string Name { get; set; }
		
		/// <summary>
		/// The path of this poster.
		/// By default, the http path for this poster is returned from the public API.
		/// This can be disabled using the internal query flag.
		/// </summary>
		[SerializeAs("{HOST}/api/people/{Slug}/poster")] public string Poster { get; set; }
		
		/// <inheritdoc />
		public ICollection<MetadataID> ExternalIDs { get; set; }
		
		/// <summary>
		/// The list of roles this person has played in. See <see cref="PeopleRole"/> for more information.
		/// </summary>
		[EditableRelation] [LoadableRelation] public ICollection<PeopleRole> Roles { get; set; }
	}
}
