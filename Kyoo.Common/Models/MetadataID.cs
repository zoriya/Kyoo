using System;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	public class MetadataID
	{
		[JsonIgnore] public int ID { get; set; }
		[JsonIgnore] public int ProviderID { get; set; }
		public virtual ProviderID Provider {get; set; }
		
		[JsonIgnore] public int? ShowID { get; set; } 
		[JsonIgnore] public virtual Show Show { get; set; }
		
		[JsonIgnore] public int? EpisodeID { get; set; } 
		[JsonIgnore] public virtual Episode Episode { get; set; }
		
		[JsonIgnore] public int? SeasonID { get; set; } 
		[JsonIgnore] public virtual Season Season { get; set; }
		
		[JsonIgnore] public int? PeopleID { get; set; } 
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