using System.Collections.Generic;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	public class Genre : IResource
	{
		[JsonIgnore] public int ID { get; set; }
		public string Slug { get; set; }
		public string Name { get; set; }
		
		[JsonIgnore] public virtual ICollection<Show> Shows { get; set; }

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
