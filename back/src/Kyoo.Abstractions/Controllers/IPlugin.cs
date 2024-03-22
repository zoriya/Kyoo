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
	public interface IPlugin
	{
		/// <summary>
		/// The name of the plugin
		/// </summary>
		string Name { get; }

		/// <summary>
		/// An optional configuration step to allow a plugin to change asp net configurations.
		/// </summary>
		/// <seealso cref="SA"/>
		IEnumerable<IStartupAction> ConfigureSteps => ArraySegment<IStartupAction>.Empty;

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
	}
}
