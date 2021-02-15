using System.Collections.Generic;
using System.Linq;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	public class ShowDE : Show
	{
		[EditableRelation] [JsonReadOnly] [NotMergable] public virtual ICollection<GenreLink> GenreLinks { get; set; }
		[ExpressionRewrite(nameof(GenreLinks), nameof(GenreLink.Child))]
		public override ICollection<Genre> Genres
		{
			get => GenreLinks?.Select(x => x.Child).ToList();
			set => GenreLinks = value?.Select(x => new GenreLink(this, x)).ToList();
		}
		
		[JsonReadOnly] [NotMergable] public virtual ICollection<LibraryLink> LibraryLinks { get; set; }
		[ExpressionRewrite(nameof(LibraryLinks), nameof(LibraryLink.Library))]
		public override ICollection<Library> Libraries
		{
			get => LibraryLinks?.Select(x => x.Library).ToList();
			set => LibraryLinks = value?.Select(x => new LibraryLink(x, this)).ToList();
		}
		
		[JsonReadOnly] [NotMergable] public virtual ICollection<CollectionLink> CollectionLinks { get; set; }
		[ExpressionRewrite(nameof(CollectionLinks), nameof(CollectionLink.Parent))]
		public override ICollection<Collection> Collections
		{
			get => CollectionLinks?.Select(x => x.Parent).ToList();
			set => CollectionLinks = value?.Select(x => new CollectionLink(x, this)).ToList();
		}

		public ShowDE() {}

		public ShowDE(Show show)
		{
			Utility.Assign(this, show);
		}
	}
}