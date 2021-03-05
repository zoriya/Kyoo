using System.Collections.Generic;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	public class Collection : IResource
	{
		public int ID { get; set; }
		public string Slug { get; set; }
		public string Name { get; set; }
		public string Poster { get; set; }
		public string Overview { get; set; }
		[LoadableRelation] public virtual ICollection<Show> Shows { get; set; }
		[LoadableRelation] public virtual ICollection<Library> Libraries { get; set; }

#if ENABLE_INTERNAL_LINKS
		[SerializeIgnore] public virtual ICollection<Link<Collection, Show>> ShowLinks { get; set; }
		[SerializeIgnore] public virtual ICollection<Link<Library, Collection>> LibraryLinks { get; set; }
#endif
		
		public Collection() { }

		public Collection(string slug, string name, string overview, string poster)
		{
			Slug = slug;
			Name = name;
			Overview = overview;
			Poster = poster;
		}
	}
}
