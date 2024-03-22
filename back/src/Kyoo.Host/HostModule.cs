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

using System.Collections.Generic;
using Autofac;
using Autofac.Extras.AttributeMetadata;
using Kyoo.Abstractions.Controllers;
using Microsoft.AspNetCore.Builder;
using Serilog;

namespace Kyoo.Host;

/// <summary>
/// A module that registers host controllers and other needed things.
/// </summary>
public class HostModule : IPlugin
{
	/// <inheritdoc />
	public string Name => "Host";

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
	}

	/// <inheritdoc />
	public IEnumerable<IStartupAction> ConfigureSteps =>
		new[] { SA.New<IApplicationBuilder>(app => app.UseSerilogRequestLogging(), SA.Before) };
}
