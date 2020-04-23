using Newtonsoft.Json;

namespace Kyoo.Models
{
	public class ProviderID
	{
		[JsonIgnore] public long ID { get; set; }
		public string Name { get; set; }
		public string Logo { get; set; }

		public ProviderID() { }

		public ProviderID(long id, string name, string logo)
		{
			ID = id;
			Name = name;
			Logo = logo;
		}

		protected bool Equals(ProviderID other)
		{
			return Name == other.Name;
		}

		public override bool Equals(object obj)
		{
			if (ReferenceEquals(null, obj))
				return false;
			if (ReferenceEquals(this, obj))
				return true;
			if (obj.GetType() != this.GetType())
				return false;
			return Equals((ProviderID)obj);
		}

		public override int GetHashCode()
		{
			return Name != null ? Name.GetHashCode() : 0;
		}
	}
}