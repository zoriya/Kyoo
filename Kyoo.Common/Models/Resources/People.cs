using System.Collections.Generic;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	/// <summary>
	/// An actor, voice actor, writer, animator, somebody who worked on a <see cref="Show"/>. 
	/// </summary>
	public class People : IResource
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
		
		/// <summary>
        /// The link to metadata providers that this person has. See <see cref="MetadataID"/> for more information.
        /// </summary>
		[EditableRelation] [LoadableRelation] public ICollection<MetadataID> ExternalIDs { get; set; }
		
		/// <summary>
		/// The list of roles this person has played in. See <see cref="PeopleRole"/> for more information.
		/// </summary>
		[EditableRelation] [LoadableRelation] public ICollection<PeopleRole> Roles { get; set; }
	}
}
