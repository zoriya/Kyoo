using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	/// <summary>
	/// ID and link of an item on an external provider.
	/// </summary>
	public class MetadataID
	{
		/// <summary>
		/// The unique ID of this metadata. This is the equivalent of <see cref="IResource.ID"/>.
		/// </summary>
		[SerializeIgnore] public int ID { get; set; }
		
		[SerializeIgnore] public int ProviderID { get; set; }
		public Provider Provider {get; set; }
		
		[SerializeIgnore] public int? ShowID { get; set; } 
		[SerializeIgnore] public Show Show { get; set; }
		
		[SerializeIgnore] public int? EpisodeID { get; set; } 
		[SerializeIgnore] public Episode Episode { get; set; }
		
		[SerializeIgnore] public int? SeasonID { get; set; } 
		[SerializeIgnore] public Season Season { get; set; }
		
		[SerializeIgnore] public int? PeopleID { get; set; } 
		[SerializeIgnore] public People People { get; set; }
		
		public string DataID { get; set; }
		public string Link { get; set; }
	}
}