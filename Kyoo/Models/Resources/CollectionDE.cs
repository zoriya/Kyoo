using System.Collections.Generic;
using System.Linq;
using Kyoo.Models.Attributes;
using Newtonsoft.Json;

namespace Kyoo.Models
{
	public class CollectionDE : Collection
	{
		[JsonIgnore] [NotMergable] public virtual IEnumerable<CollectionLink> Links { get; set; }
		[ExpressionRewrite(nameof(Links), nameof(CollectionLink.Show))]
		public override IEnumerable<Show> Shows
		{
			get => Links?.Select(x => x.Show);
			set => Links = value?.Select(x => new CollectionLink(this, x));
		}
		
		[JsonIgnore] [NotMergable] public virtual IEnumerable<LibraryLink> LibraryLinks { get; set; }
		
		[ExpressionRewrite(nameof(LibraryLinks), nameof(GenreLink.Genre))]
		public override IEnumerable<Library> Libraries
		{
			get => LibraryLinks?.Select(x => x.Library);
			set => LibraryLinks = value?.Select(x => new LibraryLink(x, this));
		}
		
		public CollectionDE() {}

		public CollectionDE(Collection collection)
		{
			Utility.Assign(this, collection);
		}
	}
}