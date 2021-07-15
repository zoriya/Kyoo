using System;
using Kyoo.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace Kyoo.Controllers
{
	/// <summary>
	/// A metadata provider composite that merge results from all available providers.
	/// </summary>
	public class ProviderComposite : IProviderComposite
	{
		/// <summary>
		/// The list of metadata providers
		/// </summary>
		private readonly ICollection<IMetadataProvider> _providers;

		/// <summary>
		/// The list of selected providers. If no provider has been selected, this is null.
		/// </summary>
		private ICollection<Provider> _selectedProviders;

		/// <summary>
		/// The logger used to print errors.
		/// </summary>
		private readonly ILogger<ProviderComposite> _logger;
		
		/// <summary>
		/// Since this is a composite and not a real provider, no metadata is available.
		/// It is not meant to be stored or selected. This class will handle merge based on what is required. 
		/// </summary>
		public Provider Provider => null;


		/// <summary>
		/// Create a new <see cref="ProviderComposite"/> with a list of available providers.
		/// </summary>
		/// <param name="providers">The list of providers to merge.</param>
		/// <param name="logger">The logger used to print errors.</param>
		public ProviderComposite(IEnumerable<IMetadataProvider> providers, ILogger<ProviderComposite> logger)
		{
			_providers = providers.ToArray();
			_logger = logger;
		}
		

		/// <inheritdoc />
		public void UseProviders(IEnumerable<Provider> providers)
		{
			_selectedProviders = providers.ToArray();
		}

		/// <summary>
		/// Return the list of providers that should be used for queries.
		/// </summary>
		/// <returns>The list of providers to use, respecting the <see cref="UseProviders"/>.</returns>
		private IEnumerable<IMetadataProvider> _GetProviders()
		{
			return _selectedProviders?
					.Select(x => _providers.FirstOrDefault(y => y.Provider.Slug == x.Slug))
					.Where(x => x != null)
				?? _providers;
		}

		/// <inheritdoc />
		public async Task<T> Get<T>(T item)
			where T : class, IResource
		{
			T ret = item;

			foreach (IMetadataProvider provider in _GetProviders())
			{
				try
				{
					ret = Merger.Merge(ret, await provider.Get(ret));
				}
				catch (Exception ex) 
				{
					_logger.LogError(ex, "The provider {Provider} could not get a {Type}", 
						provider.Provider.Name, typeof(T).Name);
				}
			}

			return ret;
		}

		/// <inheritdoc />
		public async Task<ICollection<T>> Search<T>(string query) 
			where T : class, IResource
		{
			List<T> ret = new();
			
			foreach (IMetadataProvider provider in _GetProviders())
			{
				try
				{
					ret.AddRange(await provider.Search<T>(query));
				}
				catch (Exception ex) 
				{
					_logger.LogError(ex, "The provider {Provider} could not search for {Type}", 
						provider.Provider.Name, typeof(T).Name);
				}
			}

			return ret;
		}
	}
}
