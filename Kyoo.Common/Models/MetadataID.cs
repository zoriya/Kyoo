namespace Kyoo.Models
{
	public class MetadataID
	{
		public long ID { get; set; }
		public long ProviderID { get; set; }
		public virtual ProviderID Provider {get; set; }
		
		public long? ShowID { get; set; } 
		public virtual Show Show { get; set; }
		
		public long? EpisodeID { get; set; } 
		public virtual Episode Episode { get; set; }
		
		public long? SeasonID { get; set; } 
		public virtual Season Season { get; set; }
		
		public long? PeopleID { get; set; } 
		public virtual People People { get; set; }
		
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