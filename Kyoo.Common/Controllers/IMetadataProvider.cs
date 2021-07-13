using System;
using Kyoo.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
using JetBrains.Annotations;

namespace Kyoo.Controllers
{
	/// <summary>
	/// An interface to automatically retrieve metadata from external providers.
	/// </summary>
	public interface IMetadataProvider
	{
		/// <summary>
		/// The <see cref="Provider"/> corresponding to this provider.
		/// This allow to map metadata to a provider, keep metadata links and
		/// know witch <see cref="IMetadataProvider"/> is used for a specific <see cref="Library"/>.
		/// </summary>
		Provider Provider { get; }

		/// <summary>
		/// Return a new item with metadata from your provider.
		/// </summary>
		/// <param name="item">
		/// The item to retrieve metadata from. Most of the time, only the name will be available but other
		/// properties may be filed by other providers before a call to this method. This can allow you to identify
		/// the collection on your provider.
		/// </param>
		/// <remarks>
		/// You must not use metadata from the given <paramref name="item"/>.
		/// Merging metadata is the job of Kyoo, a complex <typeparamref name="T"/> is given
		/// to make a precise search and give you every available properties, not to discard properties.
		/// </remarks>
		/// <exception cref="NotSupportedException">
		/// If this metadata provider does not support <typeparamref name="T"/>.
		/// </exception>
		/// <returns>A new <typeparamref name="T"/> containing metadata from your provider</returns>
		[ItemNotNull]
		Task<T> Get<T>([NotNull] T item)
			where T : class, IResource;

		/// <summary>
		/// Search for a specific type of items with a given query.
		/// </summary>
		/// <param name="query">The search query to use.</param>
		/// <exception cref="NotSupportedException">
		/// If this metadata provider does not support <typeparamref name="T"/>.
		/// </exception>
		/// <returns>The list of items that could be found on this specific provider.</returns>
		[ItemNotNull]
		Task<ICollection<T>> Search<T>(string query)
			where T : class, IResource;
		
		Task<ICollection<PeopleRole>> GetPeople(Show show);
	}
}
