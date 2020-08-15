using System.Collections.Generic;
using System.Linq;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	public class CollectionDE : Collection
	{
		[NotMergable] public virtual IEnumerable<CollectionLink> Links { get; set; }
		public override IEnumerable<Show> Shows
		{
			get => Links?.Select(x => x.Show);
			set => Links = value?.Select(x => new CollectionLink(this, x));
		}
		
		[NotMergable] public virtual IEnumerable<LibraryLink> LibraryLinks { get; set; }
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