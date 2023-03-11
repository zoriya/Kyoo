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
using Autofac.Extras.AttributeMetadata;
using Kyoo.Abstractions;
using Kyoo.Abstractions.Controllers;
using Kyoo.Core.Models.Options;
using Kyoo.Core.Tasks;
using Kyoo.Host.Generic.Controllers;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;
using Serilog;

namespace Kyoo.Host.Generic
{
	/// <summary>
	/// A module that registers host controllers and other needed things.
	/// </summary>
	public class HostModule : IPlugin
	{
		/// <inheritdoc />
		public string Slug => "host";

		/// <inheritdoc />
		public string Name => "Host";

		/// <inheritdoc />
		public string Description => "A module that registers host controllers and other needed things.";

		/// <inheritdoc />
		public Dictionary<string, Type> Configuration => new()
		{
			{ BasicOptions.Path, typeof(BasicOptions) },
		};

		/// <summary>
		/// The plugin manager that loaded all plugins.
		/// </summary>
		private readonly IPluginManager _plugins;

		/// <summary>
		/// Create a new <see cref="HostModule"/>.
		/// </summary>
		/// <param name="plugins">The plugin manager that loaded all plugins.</param>
		public HostModule(IPluginManager plugins)
		{
			_plugins = plugins;
		}

		/// <inheritdoc />
		public void Configure(ContainerBuilder builder)
		{
			builder.RegisterModule<AttributedMetadataModule>();
			builder.RegisterInstance(_plugins).As<IPluginManager>().ExternallyOwned();
			builder.RegisterComposite<FileSystemComposite, IFileSystem>().InstancePerLifetimeScope();
			builder.RegisterType<TaskManager>().As<ITaskManager>().As<IHostedService>().SingleInstance();
			builder.RegisterTask<PluginInitializer>();
		}

		/// <inheritdoc />
		public IEnumerable<IStartupAction> ConfigureSteps => new[]
		{
			SA.New<IApplicationBuilder>(app => app.UseSerilogRequestLogging(), SA.Before)
		};
	}
}
