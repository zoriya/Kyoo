using Kyoo.Abstractions.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
using JetBrains.Annotations;

namespace Kyoo.Abstractions.Controllers
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
		/// <returns>A new <typeparamref name="T"/> containing metadata from your provider or null</returns>
		[ItemCanBeNull]
		Task<T> Get<T>([NotNull] T item)
			where T : class, IResource;

		/// <summary>
		/// Search for a specific type of items with a given query.
		/// </summary>
		/// <param name="query">The search query to use.</param>
		/// <returns>The list of items that could be found on this specific provider.</returns>
		[ItemNotNull]
		Task<ICollection<T>> Search<T>(string query)
			where T : class, IResource;
	}

	/// <summary>
	/// A special <see cref="IMetadataProvider"/> that merge results.
	/// This interface exists to specify witch provider to use but it can be used like any other metadata provider.
	/// </summary>
	public abstract class AProviderComposite : IMetadataProvider
	{
		/// <inheritdoc />
		[ItemNotNull]
		public abstract Task<T> Get<T>(T item)
			where T : class, IResource;

		/// <inheritdoc />
		public abstract Task<ICollection<T>> Search<T>(string query)
			where T : class, IResource;

		/// <summary>
		/// Since this is a composite and not a real provider, no metadata is available.
		/// It is not meant to be stored or selected. This class will handle merge based on what is required. 
		/// </summary>
		public Provider Provider => null;

		/// <summary>
		/// Select witch providers to use.
		/// The <see cref="IMetadataProvider"/> associated with the given <see cref="Provider"/> will be used.
		/// </summary>
		/// <param name="providers">The list of providers to use</param>
		public abstract void UseProviders(IEnumerable<Provider> providers);
	}
}
