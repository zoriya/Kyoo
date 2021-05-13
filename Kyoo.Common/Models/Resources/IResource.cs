namespace Kyoo.Models
{
	/// <summary>
	/// An interface to represent a resource that can be retrieved from the database.
	/// </summary>
	public interface IResource
	{
		/// <summary>
		/// A unique ID for this type of resource. This can't be changed and duplicates are not allowed.
		/// </summary>
		public int ID { get; set; }
		
		/// <summary>
		/// A human-readable identifier that can be used instead of an ID.
		/// A slug must be unique for a type of resource but it can be changed.
		/// </summary>
		/// <remarks>
		/// There is no setter for a slug since it can be computed from other fields.
		/// For example, a season slug is {ShowSlug}-s{SeasonNumber}.
		/// </remarks>
		public string Slug { get; } 
	}
}