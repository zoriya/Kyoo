using System.Collections.Generic;
using Kyoo.Abstractions.Models.Attributes;

namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// A library containing <see cref="Show"/> and <see cref="Collection"/>.
	/// </summary>
	public class Library : IResource
	{
		/// <inheritdoc />
		public int ID { get; set; }
		
		/// <inheritdoc />
		public string Slug { get; set; }
		
		/// <summary>
		/// The name of this library.
		/// </summary>
		public string Name { get; set; }
		
		/// <summary>
		/// The list of paths that this library is responsible for. This is mainly used by the Scan task.
		/// </summary>
		public string[] Paths { get; set; }

		/// <summary>
		/// The list of <see cref="Provider"/> used for items in this library.
		/// </summary>
		[EditableRelation] [LoadableRelation] public ICollection<Provider> Providers { get; set; }

		/// <summary>
		/// The list of shows in this library.
		/// </summary>
		[LoadableRelation] public ICollection<Show> Shows { get; set; }
		
		/// <summary>
		/// The list of collections in this library.
		/// </summary>
		[LoadableRelation] public ICollection<Collection> Collections { get; set; }
	}
}
