using System.Collections.Generic;
using System.Linq;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	public class LibraryDE : Library
	{
		[NotMergable] public virtual IEnumerable<ProviderLink> ProviderLinks { get; set; }
		public override IEnumerable<ProviderID> Providers
		{
			get => ProviderLinks?.Select(x => x.Provider);
			set => ProviderLinks = value.Select(x => new ProviderLink(x, this)).ToList();
		}
		
		[NotMergable] public virtual IEnumerable<LibraryLink> Links { get; set; }
		public override IEnumerable<Show> Shows
		{
			get => Links?.Where(x => x.Show != null).Select(x => x.Show);
			set => Links = Utility.MergeLists(
				value?.Select(x => new LibraryLink(this, x)), 
				Links?.Where(x => x.Show == null));
		}
		public override IEnumerable<Collection> Collections
		{
			get => Links?.Where(x => x.Collection != null).Select(x => x.Collection);
			set => Links = Utility.MergeLists(
				value?.Select(x => new LibraryLink(this, x)), 
				Links?.Where(x => x.Collection == null));
		}
		
		public LibraryDE() {}

		public LibraryDE(Library item)
		{
			Utility.Assign(this, item);
		}
	}
}