using System.Collections.Generic;
using System.Linq;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	public class ShowDE : Show
	{
		[NotMergable] public virtual IEnumerable<GenreLink> GenreLinks { get; set; }
		public override IEnumerable<Genre> Genres
		{
			get => GenreLinks?.Select(x => x.Genre);
			set => GenreLinks = value?.Select(x => new GenreLink(this, x)).ToList();
		}
		
		[NotMergable] public virtual IEnumerable<LibraryLink> LibraryLinks { get; set; }
		public override IEnumerable<Library> Libraries
		{
			get => LibraryLinks?.Select(x => x.Library);
			set => LibraryLinks = value?.Select(x => new LibraryLink(x, this));
		}
		
		[NotMergable] public virtual IEnumerable<CollectionLink> CollectionLinks { get; set; }
		
		public override IEnumerable<Collection> Collections
		{
			get => CollectionLinks?.Select(x => x.Collection);
			set => CollectionLinks = value?.Select(x => new CollectionLink(x, this));
		}

		public override void OnMerge(object merged)
		{
			base.OnMerge(merged);
			
			if (GenreLinks != null)
				foreach (GenreLink genre in GenreLinks)
					genre.Show = this;
		}
		
		public ShowDE() {}

		public ShowDE(Show show)
		{
			Utility.Assign(this, show);
		}
	}
}