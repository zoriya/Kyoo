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
using System.Reflection;
using Autofac;
using Kyoo.Abstractions.Controllers;
using Kyoo.Authentication;
using Kyoo.Core;
using Kyoo.Host.Controllers;
using Kyoo.Meiliseach;
using Kyoo.Postgresql;
using Kyoo.RabbitMq;
using Kyoo.Swagger;
using Kyoo.Utils;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Kyoo.Host;

/// <summary>
/// The Startup class is used to configure the AspNet's webhost.
/// </summary>
public class PluginsStartup
{
	/// <summary>
	/// A plugin manager used to load plugins and allow them to configure services / asp net.
	/// </summary>
	private readonly IPluginManager _plugins;

	/// <summary>
	/// The plugin that adds controllers and tasks specific to this host.
	/// </summary>
	private readonly IPlugin _hostModule;

	/// <summary>
	/// Created from the DI container, those services are needed to load information and instantiate plugins.s
	/// </summary>
	/// <param name="plugins">The plugin manager to use to load new plugins and configure the host.</param>
	public PluginsStartup(IPluginManager plugins)
	{
		_plugins = plugins;
		_hostModule = new HostModule(_plugins);
		_plugins.LoadPlugins(
			typeof(CoreModule),
			typeof(AuthenticationModule),
			typeof(PostgresModule),
			typeof(MeilisearchModule),
			typeof(RabbitMqModule),
			typeof(SwaggerModule)
		);
	}

	/// <summary>
	/// Create a new <see cref="PluginsStartup"/> from a webhost.
	/// This is meant to be used from <see cref="WebHostBuilderExtensions.UseStartup"/>.
	/// </summary>
	/// <param name="host">The context of the web host.</param>
	/// <param name="logger">
	/// The logger factory used to log while the application is setting itself up.
	/// </param>
	/// <returns>A new <see cref="PluginsStartup"/>.</returns>
	public static PluginsStartup FromWebHost(WebHostBuilderContext host, ILoggerFactory logger)
	{
		HostServiceProvider hostProvider = new(host.HostingEnvironment, host.Configuration, logger);
		PluginManager plugins = new(hostProvider, logger.CreateLogger<PluginManager>());
		return new PluginsStartup(plugins);
	}

	/// <summary>
	/// Configure the services context via the <see cref="PluginManager"/>.
	/// </summary>
	/// <param name="services">The service collection to fill.</param>
	public void ConfigureServices(IServiceCollection services)
	{
		foreach (Assembly assembly in _plugins.GetAllPlugins().Select(x => x.GetType().Assembly))
			services.AddMvcCore().AddApplicationPart(assembly);

		_hostModule.Configure(services);
		foreach (IPlugin plugin in _plugins.GetAllPlugins())
			plugin.Configure(services);
	}

	/// <summary>
	/// Configure the autofac container via the <see cref="PluginManager"/>.
	/// </summary>
	/// <param name="builder">The builder to configure.</param>
	public void ConfigureContainer(ContainerBuilder builder)
	{
		_hostModule.Configure(builder);
		foreach (IPlugin plugin in _plugins.GetAllPlugins())
			plugin.Configure(builder);
	}

	/// <summary>
	/// Configure the asp net host.
	/// </summary>
	/// <param name="app">The asp net host to configure</param>
	/// <param name="container">An autofac container used to create a new scope to configure asp-net.</param>
	public void Configure(IApplicationBuilder app, ILifetimeScope container)
	{
		IEnumerable<IStartupAction> steps = _plugins
			.GetAllPlugins()
			.Append(_hostModule)
			.SelectMany(x => x.ConfigureSteps)
			.OrderByDescending(x => x.Priority);

		using ILifetimeScope scope = container.BeginLifetimeScope(x =>
			x.RegisterInstance(app).SingleInstance().ExternallyOwned()
		);
		IServiceProvider provider = scope.Resolve<IServiceProvider>();
		foreach (IStartupAction step in steps)
			step.Run(provider);
	}

	/// <summary>
	/// A simple host service provider used to activate plugins instance.
	/// The same services as a generic host are available and an <see cref="ILoggerFactory"/> has been added.
	/// </summary>
	private class HostServiceProvider(
		IWebHostEnvironment hostEnvironment,
		IConfiguration configuration,
		ILoggerFactory loggerFactory
	) : IServiceProvider
	{
		/// <inheritdoc />
		public object GetService(Type serviceType)
		{
			if (
				serviceType == typeof(IWebHostEnvironment)
				|| serviceType == typeof(IHostEnvironment)
			)
				return hostEnvironment;
			if (serviceType == typeof(IConfiguration))
				return configuration;
			if (serviceType == typeof(IServiceProviderIsService))
				return new ProviderIsService();
			if (
				serviceType.IsGenericType
				&& serviceType.GetGenericTypeDefinition() == typeof(ILogger<>)
			)
			{
				return Utility.RunGenericMethod<object>(
					typeof(LoggerFactoryExtensions),
					nameof(LoggerFactoryExtensions.CreateLogger),
					serviceType.GetGenericArguments().First(),
					loggerFactory
				);
			}

			throw new ArgumentException(
				$"{serviceType.Name} is not available in configuration stpe"
			);
		}

		public class ProviderIsService : IServiceProviderIsService
		{
			public bool IsService(Type serviceType)
			{
				Type[] supported =
				[
					typeof(IWebHostEnvironment),
					typeof(IHostEnvironment),
					typeof(IConfiguration),
					typeof(IServiceProviderIsService),
				];
				if (supported.Contains(serviceType))
					return true;
				return serviceType.IsGenericType
					&& serviceType.GetGenericTypeDefinition() == typeof(ILogger<>);
			}
		}
	}
}
