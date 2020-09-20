using System.Collections.Generic;
using System.Linq;
using Kyoo.Models.Attributes;
using Newtonsoft.Json;


// TODO Remove every [JsonIgnore] tag from here once the serializer knows which property should be serialized.

namespace Kyoo.Models
{
	public class ShowDE : Show
	{
		[JsonIgnore] [NotMergable] public virtual ICollection<GenreLink> GenreLinks { get; set; }
		[ExpressionRewrite(nameof(GenreLinks), nameof(GenreLink.Genre))]
		public override IEnumerable<Genre> Genres
		{
			get => GenreLinks?.Select(x => x.Genre);
			set => GenreLinks = value?.Select(x => new GenreLink(this, x)).ToList();
		}
		
		[JsonIgnore] [NotMergable] public virtual ICollection<LibraryLink> LibraryLinks { get; set; }
		[ExpressionRewrite(nameof(LibraryLinks), nameof(LibraryLink.Library))]
		public override IEnumerable<Library> Libraries
		{
			get => LibraryLinks?.Select(x => x.Library);
			set => LibraryLinks = value?.Select(x => new LibraryLink(x, this)).ToList();
		}
		
		[JsonIgnore] [NotMergable] public virtual ICollection<CollectionLink> CollectionLinks { get; set; }
		[ExpressionRewrite(nameof(CollectionLinks), nameof(CollectionLink.Collection))]
		public override IEnumerable<Collection> Collections
		{
			get => CollectionLinks?.Select(x => x.Collection);
			set => CollectionLinks = value?.Select(x => new CollectionLink(x, this)).ToList();
		}

		public ShowDE() {}

		public ShowDE(Show show)
		{
			Utility.Assign(this, show);
		}
	}
}