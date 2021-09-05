using System;
using System.Collections.Generic;
using System.Linq;
using JetBrains.Annotations;
using Kyoo.Abstractions.Models.Attributes;

namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// An interface applied to resources containing external metadata.
	/// </summary>
	public interface IMetadata
	{
		/// <summary>
		/// The link to metadata providers that this show has. See <see cref="MetadataID"/> for more information.
		/// </summary>
		[EditableRelation]
		[LoadableRelation]
		public ICollection<MetadataID> ExternalIDs { get; set; }
	}

	/// <summary>
	/// A static class containing extensions method for every <see cref="IMetadata"/> class.
	/// This allow one to use metadata more easily.
	/// </summary>
	public static class MetadataExtension
	{
		/// <summary>
		/// Retrieve the internal provider's ID of an item using it's provider slug.
		/// </summary>
		/// <remarks>
		/// This method will never return anything if the <see cref="IMetadata.ExternalIDs"/> are not loaded.
		/// </remarks>
		/// <param name="self">An instance of <see cref="IMetadata"/> to retrieve the ID from.</param>
		/// <param name="provider">The slug of the provider</param>
		/// <returns>The <see cref="MetadataID.DataID"/> field of the asked provider.</returns>
		[CanBeNull]
		public static string GetID(this IMetadata self, string provider)
		{
			return self.ExternalIDs?.FirstOrDefault(x => x.Provider.Slug == provider)?.DataID;
		}

		/// <summary>
		/// Retrieve the internal provider's ID of an item using it's provider slug.
		/// If the ID could be found, it is converted to the <typeparamref name="T"/> type and <c>true</c> is returned.
		/// </summary>
		/// <remarks>
		/// This method will never succeed if the <see cref="IMetadata.ExternalIDs"/> are not loaded.
		/// </remarks>
		/// <param name="self">An instance of <see cref="IMetadata"/> to retrieve the ID from.</param>
		/// <param name="provider">The slug of the provider</param>
		/// <param name="id">
		/// The <see cref="MetadataID.DataID"/> field of the asked provider parsed
		/// and converted to the <typeparamref name="T"/> type.
		/// It is only relevant if this method returns <c>true</c>.
		/// </param>
		/// <typeparam name="T">The type to convert the <see cref="MetadataID.DataID"/> to.</typeparam>
		/// <returns><c>true</c> if this method succeeded, <c>false</c> otherwise.</returns>
		public static bool TryGetID<T>(this IMetadata self, string provider, out T id)
		{
			string dataID = self.ExternalIDs?.FirstOrDefault(x => x.Provider.Slug == provider)?.DataID;
			if (dataID == null)
			{
				id = default;
				return false;
			}

			try
			{
				id = (T)Convert.ChangeType(dataID, typeof(T));
			}
			catch
			{
				id = default;
				return false;
			}
			return true;
		}
	}
}
