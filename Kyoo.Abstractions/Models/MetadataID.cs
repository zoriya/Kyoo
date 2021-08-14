using System;
using System.Linq.Expressions;
using Kyoo.Abstractions.Models.Attributes;

namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// ID and link of an item on an external provider.
	/// </summary>
	public class MetadataID
	{
		/// <summary>
		/// The ID of the resource which possess the metadata.
		/// </summary>
		[SerializeIgnore] public int ResourceID { get; set; }

		/// <summary>
		/// The ID of the provider.
		/// </summary>
		[SerializeIgnore] public int ProviderID { get; set; }

		/// <summary>
		/// The provider that can do something with this ID.
		/// </summary>
		public Provider Provider { get; set; }

		/// <summary>
		/// The ID of the resource on the external provider.
		/// </summary>
		public string DataID { get; set; }

		/// <summary>
		/// The URL of the resource on the external provider.
		/// </summary>
		public string Link { get; set; }

		/// <summary>
		/// The expression to retrieve the unique ID of a MetadataID. This is an aggregate of the two resources IDs.
		/// </summary>
		public static Expression<Func<MetadataID, object>> PrimaryKey
		{
			get { return x => new { First = x.ResourceID, Second = x.ProviderID }; }
		}
	}
}