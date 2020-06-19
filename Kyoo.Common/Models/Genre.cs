using System.Collections.Generic;
using System.Linq;
using Kyoo.Models.Attributes;
using Newtonsoft.Json;

namespace Kyoo.Models
{
	public class Genre
	{
		[JsonIgnore] public int ID { get; set; }
		public string Slug { get; set; }
		public string Name { get; set; }
		
		[NotMergable] [JsonIgnore] public IEnumerable<GenreLink> Links { get; set; }

		[NotMergable] [JsonIgnore] public IEnumerable<Show> Shows
		{
			get => Links.Select(x => x.Show);
			set => Links = value?.Select(x => new GenreLink(x, this));
		}

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
