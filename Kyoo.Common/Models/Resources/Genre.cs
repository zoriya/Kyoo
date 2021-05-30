using System.Collections.Generic;
using Kyoo.Common.Models.Attributes;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
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
		
#if ENABLE_INTERNAL_LINKS
		/// <summary>
		/// The internal link between this genre and shows in the <see cref="Shows"/> list.
		/// </summary>
		[Link] public ICollection<Link<Show, Genre>> ShowLinks { get; set; }
#endif
		
		/// <summary>
		/// Create a new, empty <see cref="Genre"/>.
		/// </summary>
		public Genre() {}
		
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
