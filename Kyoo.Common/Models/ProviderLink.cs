using Newtonsoft.Json;

namespace Kyoo.Models
{
	public class ProviderLink
	{
		[JsonIgnore] public long ID { get; set; }
		[JsonIgnore] public long ProviderID { get; set; }
		[JsonIgnore] public virtual ProviderID Provider { get; set; }
		[JsonIgnore] public long? LibraryID { get; set; }
		[JsonIgnore] public virtual Library Library { get; set; }

		public string Name
		{
			get => Provider?.Name;
			set
			{
				if (Provider != null)
					Provider.Name = value;
				else
					Provider = new ProviderID {Name = value};
			}
		}

		public string Logo
		{
			get => Provider?.Logo;
			set
			{
				if (Provider != null)
					Provider.Logo = value;
				else
					Provider = new ProviderID {Logo = value};
			}
		}

		public ProviderLink() { }
	}
}