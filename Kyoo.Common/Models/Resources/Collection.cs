using Newtonsoft.Json;
using System.Collections.Generic;
using System.Linq;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	public class Collection : IResource
	{
		[JsonIgnore] public int ID { get; set; }
		public string Slug { get; set; }
		public string Name { get; set; }
		public string Poster { get; set; }
		public string Overview { get; set; }
		[NotMergable] [JsonIgnore] public virtual IEnumerable<CollectionLink> Links { get; set; }
		public virtual IEnumerable<Show> Shows
		{
			get => Links.Select(x => x.Show);
			set => Links = value.Select(x => new CollectionLink(this, x));
		}
		
		[NotMergable] [JsonIgnore] public virtual IEnumerable<LibraryLink> LibraryLinks { get; set; }

		[NotMergable] [JsonIgnore] public IEnumerable<Library> Libraries
		{
			get => LibraryLinks?.Select(x => x.Library);
			set => LibraryLinks = value?.Select(x => new LibraryLink(x, this));
		}

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
