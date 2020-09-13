using System.Collections.Generic;
using System.Linq;
using Kyoo.Models.Attributes;
using Newtonsoft.Json;

namespace Kyoo.Models
{
	public class LibraryDE : Library
	{
		[JsonIgnore] [NotMergable] public virtual IEnumerable<ProviderLink> ProviderLinks { get; set; }
		[ExpressionRewrite(nameof(ProviderLinks), nameof(ProviderLink.Provider))]
		public override IEnumerable<ProviderID> Providers
		{
			get => ProviderLinks?.Select(x => x.Provider);
			set => ProviderLinks = value?.Select(x => new ProviderLink(x, this)).ToList();
		}
		
		[JsonIgnore] [NotMergable] public virtual IEnumerable<LibraryLink> Links { get; set; }
		[ExpressionRewrite(nameof(Links), nameof(LibraryLink.Show))]
		public override IEnumerable<Show> Shows
		{
			get => Links?.Where(x => x.Show != null).Select(x => x.Show);
			set => Links = Utility.MergeLists(
				value?.Select(x => new LibraryLink(this, x)), 
				Links?.Where(x => x.Show == null));
		}
		[ExpressionRewrite(nameof(Links), nameof(LibraryLink.Collection))]
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