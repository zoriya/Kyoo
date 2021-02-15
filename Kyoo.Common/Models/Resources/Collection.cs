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
		[JsonIgnore] public virtual ICollection<Show> Shows { get; set; }
		[JsonIgnore] public virtual ICollection<Library> Libraries { get; set; }

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
