using Newtonsoft.Json;
using System.Collections.Generic;
using System.Linq;

namespace Kyoo.Models
{
	public class Collection : IMergable<Collection>
	{
		[JsonIgnore] public long ID { get; set; }
		public string Slug { get; set; }
		public string Name { get; set; }
		public string Poster { get; set; }
		public string Overview { get; set; }
		[JsonIgnore] public string ImgPrimary { get; set; }
		public virtual IEnumerable<Show> Shows { get; set; }

		public Collection() { }

		public Collection(string slug, string name, string overview, string imgPrimary)
		{
			Slug = slug;
			Name = name;
			Overview = overview;
			ImgPrimary = imgPrimary;
		}

		public Show AsShow()
		{
			return new Show(Slug, Name, null, null, Overview, null, null, null, null, null, null)
			{
				IsCollection = true
			};
		}

		public Collection Merge(Collection collection)
		{
			if (collection == null)
				return this;
			if (ID == -1)
				ID = collection.ID;
			Slug ??= collection.Slug;
			Name ??= collection.Name;
			Poster ??= collection.Poster;
			Overview ??= collection.Overview;
			ImgPrimary ??= collection.ImgPrimary;
			return this;
		}
	}
}
