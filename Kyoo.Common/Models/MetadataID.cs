using Newtonsoft.Json;

namespace Kyoo.Models
{
	public class MetadataID
	{
		[JsonIgnore] public long ID { get; set; }
		[JsonIgnore] public long ProviderID { get; set; }
		public virtual ProviderID Provider {get; set; }
		
		[JsonIgnore] public long? ShowID { get; set; } 
		[JsonIgnore] public virtual Show Show { get; set; }
		
		[JsonIgnore] public long? EpisodeID { get; set; } 
		[JsonIgnore] public virtual Episode Episode { get; set; }
		
		[JsonIgnore] public long? SeasonID { get; set; } 
		[JsonIgnore] public virtual Season Season { get; set; }
		
		[JsonIgnore] public long? PeopleID { get; set; } 
		[JsonIgnore] public virtual People People { get; set; }
		
		public string DataID { get; set; }
		public string Link { get; set; }

		public MetadataID() { }

		public MetadataID(ProviderID provider, string dataID, string link)
		{
			Provider = provider;
			DataID = dataID;
			Link = link;
		}
	}
}