using System.Collections.Generic;
using System.Linq;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	public class GenreDE : Genre
	{
		[JsonIgnore] [NotMergable] public virtual ICollection<GenreLink> Links { get; set; }

		[ExpressionRewrite(nameof(Links), nameof(GenreLink.Child))]
		[JsonIgnore] [NotMergable] public override IEnumerable<Show> Shows
		{
			get => Links?.Select(x => x.Parent);
			set => Links = value?.Select(x => new GenreLink(x, this)).ToList();
		}

		public GenreDE() {}

		public GenreDE(Genre item)
		{
			Utility.Assign(this, item);
		}
	}
}