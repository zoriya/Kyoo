using System.Collections.Generic;
using System.Linq;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	public class LibraryDE : Library
	{
		[EditableRelation] [SerializeIgnore] [NotMergable] public virtual ICollection<ProviderLink> ProviderLinks { get; set; }
		[ExpressionRewrite(nameof(ProviderLinks), nameof(ProviderLink.Child))]
		public override ICollection<ProviderID> Providers
		{
			get => ProviderLinks?.Select(x => x.Child).ToList();
			set => ProviderLinks = value?.Select(x => new ProviderLink(x, this)).ToList();
		}
		
		[SerializeIgnore] [NotMergable] public virtual ICollection<LibraryLink> Links { get; set; }
		[ExpressionRewrite(nameof(Links), nameof(LibraryLink.Show))]
		public override ICollection<Show> Shows
		{
			get => Links?.Where(x => x.Show != null).Select(x => x.Show).ToList();
			set => Links = Utility.MergeLists(
				value?.Select(x => new LibraryLink(this, x)), 
				Links?.Where(x => x.Show == null))?.ToList();
		}
		[ExpressionRewrite(nameof(Links), nameof(LibraryLink.Collection))]
		public override ICollection<Collection> Collections
		{
			get => Links?.Where(x => x.Collection != null).Select(x => x.Collection).ToList();
			set => Links = Utility.MergeLists(
				value?.Select(x => new LibraryLink(this, x)), 
				Links?.Where(x => x.Collection == null))?.ToList();
		}
		
		public LibraryDE() {}

		public LibraryDE(Library item)
		{
			Utility.Assign(this, item);
		}
	}
}