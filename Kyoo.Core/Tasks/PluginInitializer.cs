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
using System.Threading;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models.Attributes;

namespace Kyoo.Core.Tasks
{
	/// <summary>
	/// A task run on Kyoo's startup to initialize plugins
	/// </summary>
	[TaskMetadata("plugin-init", "Plugin Initializer", "A task to initialize plugins.",
		RunOnStartup = true, Priority = int.MaxValue, IsHidden = true)]
	public class PluginInitializer : ITask
	{
		/// <summary>
		/// The plugin manager used to retrieve plugins to initialize them.
		/// </summary>
		private readonly IPluginManager _pluginManager;

		/// <summary>
		/// The service provider given to each <see cref="IPlugin.Initialize"/> method.
		/// </summary>
		private readonly IServiceProvider _provider;

		/// <summary>
		/// Create a new <see cref="PluginInitializer"/> task
		/// </summary>
		/// <param name="pluginManager">The plugin manager used to retrieve plugins to initialize them.</param>
		/// <param name="provider">The service provider given to each <see cref="IPlugin.Initialize"/> method.</param>
		public PluginInitializer(IPluginManager pluginManager, IServiceProvider provider)
		{
			_pluginManager = pluginManager;
			_provider = provider;
		}

		/// <inheritdoc />
		public TaskParameters GetParameters()
		{
			return new();
		}

		/// <inheritdoc />
		public Task Run(TaskParameters arguments, IProgress<float> progress, CancellationToken cancellationToken)
		{
			ICollection<IPlugin> plugins = _pluginManager.GetAllPlugins();
			int count = 0;
			progress.Report(0);

			foreach (IPlugin plugin in plugins)
			{
				plugin.Initialize(_provider);

				progress.Report(count / plugins.Count * 100);
				count++;
			}

			progress.Report(100);
			return Task.CompletedTask;
		}
	}
}
