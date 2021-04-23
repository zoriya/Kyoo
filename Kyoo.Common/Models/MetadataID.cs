using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	public class MetadataID
	{
		[SerializeIgnore] public int ID { get; set; }
		[SerializeIgnore] public int ProviderID { get; set; }
		public virtual Provider Provider {get; set; }
		
		[SerializeIgnore] public int? ShowID { get; set; } 
		[SerializeIgnore] public virtual Show Show { get; set; }
		
		[SerializeIgnore] public int? EpisodeID { get; set; } 
		[SerializeIgnore] public virtual Episode Episode { get; set; }
		
		[SerializeIgnore] public int? SeasonID { get; set; } 
		[SerializeIgnore] public virtual Season Season { get; set; }
		
		[SerializeIgnore] public int? PeopleID { get; set; } 
		[SerializeIgnore] public virtual People People { get; set; }
		
		public string DataID { get; set; }
		public string Link { get; set; }

		public MetadataID() { }

		public MetadataID(Provider provider, string dataID, string link)
		{
			Provider = provider;
			DataID = dataID;
			Link = link;
		}
	}
}