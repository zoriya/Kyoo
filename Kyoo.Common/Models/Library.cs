using System.Collections;
using System.Collections.Generic;
using System.Linq;
using Kyoo.Models.Attributes;
using Newtonsoft.Json;

namespace Kyoo.Models
{
	public class Library
	{
		[JsonIgnore] public long ID { get; set; }
		public string Slug { get; set; }
		public string Name { get; set; }
		public IEnumerable<string> Paths { get; set; }

		public IEnumerable<ProviderID> Providers
		{
			get => ProviderLinks?.Select(x => x.Provider);
			set => ProviderLinks = value.Select(x => new ProviderLink(x, this)).ToList();
		}
		[NotMergable] [JsonIgnore] public virtual IEnumerable<ProviderLink> ProviderLinks { get; set; }
		[NotMergable] [JsonIgnore] public virtual IEnumerable<LibraryLink> Links { get; set; }

		[JsonIgnore] public IEnumerable<Show> Shows
		{
			get => Links?.Where(x => x.Show != null).Select(x => x.Show);
			set => Links = Utility.MergeLists(
				value?.Select(x => new LibraryLink(this, x)), 
				Links?.Where(x => x.Show == null));
		}
		[JsonIgnore] public IEnumerable<Collection> Collections
		{
			get => Links?.Where(x => x.Collection != null).Select(x => x.Collection);
			set => Links = Utility.MergeLists(
				value?.Select(x => new LibraryLink(this, x)), 
				Links?.Where(x => x.Collection == null));
		}

		public Library()  { }
		
		public Library(string slug, string name, IEnumerable<string> paths, IEnumerable<ProviderID> providers)
		{
			Slug = slug;
			Name = name;
			Paths = paths;
			Providers = providers;
		}
	}
}
