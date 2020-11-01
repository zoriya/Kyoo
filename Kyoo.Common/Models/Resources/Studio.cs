using System.Collections.Generic;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	public class Studio : IResource
	{
		[JsonIgnore] public int ID { get; set; }
		public string Slug { get; set; }
		public string Name { get; set; }
		
		[JsonIgnore] public virtual IEnumerable<Show> Shows { get; set; }

		public Studio() { }

		public Studio(string name)
		{
			Slug = Utility.ToSlug(name);
			Name = name;
		}
		
		public Studio(string slug, string name)
		{
			Slug = slug;
			Name = name;
		}
		
		public static Studio Default()
		{
			return new Studio("unknown", "Unknown Studio");
		}
	}
}
