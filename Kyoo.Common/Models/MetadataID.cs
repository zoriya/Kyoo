namespace Kyoo.Models
{
	/// <summary>
	/// ID and link of an item on an external provider.
	/// </summary>
	/// <typeparam name="T"></typeparam>
	public class MetadataID<T> : Link<T, Provider>
		where T : class, IResource
	{
		/// <summary>
		/// The ID of the resource on the external provider.
		/// </summary>
		public string DataID { get; set; }
		
		/// <summary>
		/// The URL of the resource on the external provider.
		/// </summary>
		public string Link { get; set; }
	}
}