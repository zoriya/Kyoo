using System.Collections.Generic;
using System.Linq;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	public class GenreDE : Genre
	{
		[NotMergable] public virtual IEnumerable<GenreLink> Links { get; set; }

		[NotMergable] public override IEnumerable<Show> Shows
		{
			get => Links?.Select(x => x.Show);
			set => Links = value?.Select(x => new GenreLink(x, this));
		}

		public GenreDE() {}

		public GenreDE(Genre item)
		{
			Utility.Assign(this, item);
		}
	}
}