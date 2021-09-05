using System.Collections.Generic;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Utils;

namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// A genre that allow one to specify categories for shows.
	/// </summary>
	public class Genre : IResource
	{
		/// <inheritdoc />
		public int ID { get; set; }

		/// <inheritdoc />
		public string Slug { get; set; }

		/// <summary>
		/// The name of this genre.
		/// </summary>
		public string Name { get; set; }

		/// <summary>
		/// The list of shows that have this genre.
		/// </summary>
		[LoadableRelation] public ICollection<Show> Shows { get; set; }

		/// <summary>
		/// Create a new, empty <see cref="Genre"/>.
		/// </summary>
		public Genre() { }

		/// <summary>
		/// Create a new <see cref="Genre"/> and specify it's <see cref="Name"/>.
		/// The <see cref="Slug"/> is automatically calculated from it's name.
		/// </summary>
		/// <param name="name">The name of this genre.</param>
		public Genre(string name)
		{
			Slug = Utility.ToSlug(name);
			Name = name;
		}
	}
}
