using System.Collections.Generic;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	public class Genre : IResource
	{
		public int ID { get; set; }
		public string Slug { get; set; }
		public string Name { get; set; }
		
		[LoadableRelation] public virtual ICollection<Show> Shows { get; set; }
		
#if ENABLE_INTERNAL_LINKS
		[SerializeIgnore] public virtual ICollection<Link<Show, Genre>> ShowLinks { get; set; }
#endif
		
		
		public Genre() {}
		
		public Genre(string name)
		{
			Slug = Utility.ToSlug(name);
			Name = name;
		}
		
		public Genre(string slug, string name)
		{
			Slug = slug;
			Name = name;
		}

		public Genre(int id, string slug, string name)
		{
			ID = id;
			Slug = slug;
			Name = name;
		}
	}
}
