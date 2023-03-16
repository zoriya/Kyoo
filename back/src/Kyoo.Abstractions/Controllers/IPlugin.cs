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
using Autofac;
using JetBrains.Annotations;
using Microsoft.Extensions.DependencyInjection;

namespace Kyoo.Abstractions.Controllers
{
	/// <summary>
	/// A common interface used to discord plugins
	/// </summary>
	/// <remarks>
	/// You can inject services in the IPlugin constructor.
	/// You should only inject well known services like an ILogger, IConfiguration or IWebHostEnvironment.
	/// </remarks>
	[UsedImplicitly(ImplicitUseTargetFlags.WithInheritors)]
	public interface IPlugin
	{
		/// <summary>
		/// A slug to identify this plugin in queries.
		/// </summary>
		string Slug { get; }

		/// <summary>
		/// The name of the plugin
		/// </summary>
		string Name { get; }

		/// <summary>
		/// The description of this plugin. This will be displayed on the "installed plugins" page.
		/// </summary>
		string Description { get; }

		/// <summary>
		/// <c>true</c> if the plugin should be enabled, <c>false</c> otherwise.
		/// If a plugin is not enabled, no configure method will be called.
		/// This allow one to enable a plugin if a specific configuration value is set or if the environment contains
		/// the right settings.
		/// </summary>
		/// <remarks>
		/// By default, a plugin is always enabled. This method can be overriden to change this behavior.
		/// </remarks>
		virtual bool Enabled => true;

		/// <summary>
		/// A list of types that will be available via the IOptions interfaces and will be listed inside
		/// an IConfiguration.
		///
		/// If a field should be loosely typed, <see cref="Dictionary{TKey,TValue}"/> or <c>null</c>
		/// can be specified.
		/// </summary>
		Dictionary<string, Type> Configuration { get; }

		/// <summary>
		/// An optional configuration step to allow a plugin to change asp net configurations.
		/// </summary>
		/// <seealso cref="SA"/>
		virtual IEnumerable<IStartupAction> ConfigureSteps => ArraySegment<IStartupAction>.Empty;

		/// <summary>
		/// A configure method that will be run on plugin's startup.
		/// </summary>
		/// <param name="builder">The autofac service container to register services.</param>
		void Configure(ContainerBuilder builder)
		{
			// Skipped
		}

		/// <summary>
		/// A configure method that will be run on plugin's startup.
		/// This is available for libraries that build upon a <see cref="IServiceCollection"/>, for more precise
		/// configuration use <see cref="Configure(Autofac.ContainerBuilder)"/>.
		/// </summary>
		/// <param name="services">A service container to register new services.</param>
		void Configure(IServiceCollection services)
		{
			// Skipped
		}

		/// <summary>
		/// An optional function to execute and initialize your plugin.
		/// It can be used to initialize a database connection, fill initial data or anything.
		/// </summary>
		/// <param name="provider">A service provider to request services</param>
		void Initialize(IServiceProvider provider)
		{
			// Skipped
		}
	}
}
