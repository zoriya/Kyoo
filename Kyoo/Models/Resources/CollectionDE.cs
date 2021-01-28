using System.Collections.Generic;
using System.Linq;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	public class CollectionDE : Collection
	{
		[JsonIgnore] [NotMergable] public virtual ICollection<CollectionLink> Links { get; set; }
		[ExpressionRewrite(nameof(Links), nameof(CollectionLink.Child))]
		public override IEnumerable<Show> Shows
		{
			get => Links?.Select(x => x.Child);
			set => Links = value?.Select(x => new CollectionLink(this, x)).ToList();
		}
		
		[JsonIgnore] [NotMergable] public virtual ICollection<LibraryLink> LibraryLinks { get; set; }
		
		[ExpressionRewrite(nameof(LibraryLinks), nameof(GenreLink.Child))]
		public override IEnumerable<Library> Libraries
		{
			get => LibraryLinks?.Select(x => x.Library);
			set => LibraryLinks = value?.Select(x => new LibraryLink(x, this)).ToList();
		}
		
		public CollectionDE() {}

		public CollectionDE(Collection collection)
		{
			Utility.Assign(this, collection);
		}
	}
}