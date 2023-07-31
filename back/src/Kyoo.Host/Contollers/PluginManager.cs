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
using Kyoo.Abstractions.Controllers;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Kyoo.Host.Controllers
{
	/// <summary>
	/// An implementation of <see cref="IPluginManager"/>.
	/// This is used to load plugins and retrieve information from them.
	/// </summary>
	public class PluginManager : IPluginManager
	{
		/// <summary>
		/// The service provider. It allow plugin's activation.
		/// </summary>
		private readonly IServiceProvider _provider;

		/// <summary>
		/// The logger used by this class.
		/// </summary>
		private readonly ILogger<PluginManager> _logger;

		/// <summary>
		/// The list of plugins that are currently loaded.
		/// </summary>
		private readonly List<IPlugin> _plugins = new();

		/// <summary>
		/// Create a new <see cref="PluginManager"/> instance.
		/// </summary>
		/// <param name="provider">A service container to allow initialization of plugins</param>
		/// <param name="logger">The logger used by this class.</param>
		public PluginManager(IServiceProvider provider,
			ILogger<PluginManager> logger)
		{
			_provider = provider;
			_logger = logger;
		}

		/// <inheritdoc />
		public T GetPlugin<T>(string name)
		{
			return (T)_plugins?.FirstOrDefault(x => x.Name == name && x is T);
		}

		/// <inheritdoc />
		public ICollection<T> GetPlugins<T>()
		{
			return _plugins?.OfType<T>().ToArray();
		}

		/// <inheritdoc />
		public ICollection<IPlugin> GetAllPlugins()
		{
			return _plugins;
		}

		/// <inheritdoc />
		public void LoadPlugins(ICollection<IPlugin> plugins)
		{
			_plugins.AddRange(plugins);
			_logger.LogInformation("Modules enabled: {Plugins}", _plugins.Select(x => x.Name));
		}

		/// <inheritdoc />
		public void LoadPlugins(params Type[] plugins)
		{
			LoadPlugins(plugins
				.Select(x => (IPlugin)ActivatorUtilities.CreateInstance(_provider, x))
				.ToArray()
			);
		}
	}
}
