using System;
using System.Linq.Expressions;

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

		/// <summary>
		/// A shortcut to access the provider of this metadata.
		/// Unlike the <see cref="Link{T, T2}.Second"/> property, this is serializable.
		/// </summary>
		public Provider Provider => Second;
		
		/// <summary>
		/// The expression to retrieve the unique ID of a MetadataID. This is an aggregate of the two resources IDs.
		/// </summary>
		public new static Expression<Func<MetadataID<T>, object>> PrimaryKey
		{
			get
			{
				return x => new {First = x.FirstID, Second = x.SecondID};
			}	
		}
	}
}