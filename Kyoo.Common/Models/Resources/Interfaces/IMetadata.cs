using System.Collections.Generic;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	/// <summary>
	/// An interface applied to resources containing external metadata.
	/// </summary>
	public interface IMetadata
	{
		/// <summary>
		/// The link to metadata providers that this show has. See <see cref="MetadataID"/> for more information.
		/// </summary>
		[EditableRelation] [LoadableRelation] 
		public ICollection<MetadataID> ExternalIDs { get; set; }
	}
}