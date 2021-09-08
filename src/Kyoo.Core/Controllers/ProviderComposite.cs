// Kyoo - A portable and vast media library solution.
// Copyright (c) Kyoo.
//
// See AUTHORS.md and LICENSE file in the project root for full license information.
//
// Kyoo is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// any later version.
//
// Kyoo is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Kyoo. If not, see <https://www.gnu.org/licenses/>.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Utils;
using Microsoft.Extensions.Logging;

namespace Kyoo.Core.Controllers
{
	/// <summary>
	/// A metadata provider composite that merge results from all available providers.
	/// </summary>
	public class ProviderComposite : AProviderComposite
	{
		/// <summary>
		/// The list of metadata providers
		/// </summary>
		private readonly ICollection<IMetadataProvider> _providers;

		/// <summary>
		/// The logger used to print errors.
		/// </summary>
		private readonly ILogger<ProviderComposite> _logger;

		/// <summary>
		/// The list of selected providers. If no provider has been selected, this is null.
		/// </summary>
		private ICollection<Provider> _selectedProviders;

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
		public override void UseProviders(IEnumerable<Provider> providers)
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
		public override async Task<T> Get<T>(T item)
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
		public override async Task<ICollection<T>> Search<T>(string query)
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
