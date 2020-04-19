using Newtonsoft.Json;

namespace Kyoo.Models
{
	public class Genre
	{
		[JsonIgnore] public long ID { get; set; }
		public string Slug { get; set; }
		public string Name { get; set; }
		
		// public IEnumerable<Show> Shows { get; set; }

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

		public Genre(long id, string slug, string name)
		{
			ID = id;
			Slug = slug;
			Name = name;
		}
	}
}
