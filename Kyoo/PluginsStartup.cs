using System;
using System.Collections.Generic;
using System.Linq;
using Autofac;
using Kyoo.Authentication;
using Kyoo.Controllers;
using Kyoo.Models.Options;
using Kyoo.Postgresql;
using Kyoo.SqLite;
using Kyoo.Tasks;
using Kyoo.TheMovieDb;
using Kyoo.TheTvdb;
using Kyoo.WebApp;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Kyoo
{
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
		/// The configuration used to register <see cref="IOptions{TOptions}"/> and so on for plugin's specified types.
		/// </summary>
		private readonly IConfiguration _configuration;

		/// <summary>
		/// Created from the DI container, those services are needed to load information and instantiate plugins.s
		/// </summary>
		/// <param name="plugins">The plugin manager to use to load new plugins and configure the host.</param>
		/// <param name="configuration">
		/// The configuration used to register <see cref="IOptions{TOptions}"/> and so on for plugin's specified types.
		/// </param>
		public PluginsStartup(IPluginManager plugins, IConfiguration configuration)
		{
			_plugins = plugins;
			_configuration = configuration;
			// TODO enable the web app only if it was build with it.
			_plugins.LoadPlugins(
				typeof(CoreModule),
				typeof(WebAppModule),
				typeof(AuthenticationModule),
				typeof(PostgresModule),
				typeof(SqLiteModule),
				typeof(PluginTvdb),
				typeof(PluginTmdb)
			);
		}

		/// <summary>
		/// Configure the services context via the <see cref="PluginManager"/>.
		/// </summary>
		/// <param name="services">The service collection to fill.</param>
		public void ConfigureServices(IServiceCollection services)
		{
			foreach (IPlugin plugin in _plugins.GetAllPlugins())
				plugin.Configure(services);
			
			IEnumerable<KeyValuePair<string, Type>> configTypes = _plugins.GetAllPlugins()
				.SelectMany(x => x.Configuration)
				.Where(x => x.Value != null);
			foreach ((string path, Type type) in configTypes)
			{
				Utility.RunGenericMethod<object>(
					typeof(OptionsConfigurationServiceCollectionExtensions),
					nameof(OptionsConfigurationServiceCollectionExtensions.Configure),
					type,
					services, _configuration.GetSection(path)
				);
			}
		}

		/// <summary>
		/// Configure the autofac container via the <see cref="PluginManager"/>.
		/// </summary>
		/// <param name="builder">The builder to configure.</param>
		public void ConfigureContainer(ContainerBuilder builder)
		{
			builder.RegisterInstance(_plugins).As<IPluginManager>().ExternallyOwned();
			builder.RegisterTask<PluginInitializer>();
			
			foreach (IPlugin plugin in _plugins.GetAllPlugins())
				plugin.Configure(builder);
		}

		/// <summary>
		/// Configure the asp net host.
		/// </summary>
		/// <param name="app">The asp net host to configure</param>
		/// <param name="container">An autofac container used to create a new scope to configure asp-net.</param>
		/// <param name="config">The configuration manager used to register strongly typed config.</param>
		public void Configure(IApplicationBuilder app, ILifetimeScope container, IConfigurationManager config)
		{
			IEnumerable<IStartupAction> steps = _plugins.GetAllPlugins()
				.SelectMany(x => x.ConfigureSteps)
				.OrderByDescending(x => x.Priority);

			using ILifetimeScope scope = container.BeginLifetimeScope(x =>
				x.RegisterInstance(app).SingleInstance().ExternallyOwned());
			IServiceProvider provider = scope.Resolve<IServiceProvider>();
			foreach (IStartupAction step in steps)
				step.Run(provider);

			IEnumerable<KeyValuePair<string, Type>> pluginConfig = _plugins.GetAllPlugins()
				.SelectMany(x => x.Configuration)
				.GroupBy(x => x.Key.Split(':').First())
				.Select(x => x
					.OrderBy(y => y.Key.Length)
					.First()
				);
			foreach ((string path, Type type) in pluginConfig)
				config.Register(path, type);
		}
		
		
		/// <summary>
		/// Create a new <see cref="PluginsStartup"/> from a webhost.
		/// This is meant to be used from <see cref="WebHostBuilderExtensions.UseStartup"/>.
		/// </summary>
		/// <param name="host">The context of the web host.</param>
		/// <param name="loggingConfiguration">
		/// The method used to configure the logger factory used by the plugin manager and plugins during startup.
		/// </param>
		/// <returns>A new <see cref="PluginsStartup"/>.</returns>
		public static PluginsStartup FromWebHost(WebHostBuilderContext host, 
			Action<HostBuilderContext, ILoggingBuilder> loggingConfiguration)
		{
			HostBuilderContext genericHost = new(new Dictionary<object, object>())
			{
				Configuration = host.Configuration,
				HostingEnvironment = host.HostingEnvironment
			};
			ILoggerFactory logger = LoggerFactory.Create(builder => loggingConfiguration(genericHost, builder));
			HostServiceProvider hostProvider = new(host.HostingEnvironment, host.Configuration, logger);
			PluginManager plugins = new(
				hostProvider,
				Options.Create(host.Configuration.GetSection(BasicOptions.Path).Get<BasicOptions>()),
				logger.CreateLogger<PluginManager>()
			);
			return new PluginsStartup(plugins, host.Configuration);
		}
		
		/// <summary>
		/// A simple host service provider used to activate plugins instance.
		/// The same services as a generic host are available and an <see cref="ILoggerFactory"/> has been added.
		/// </summary>
		private class HostServiceProvider : IServiceProvider
		{
			/// <summary>
			/// The host environment that could be used by plugins to configure themself.
			/// </summary>
			private readonly IWebHostEnvironment _hostEnvironment;
			
			/// <summary>
			/// The configuration context.
			/// </summary>
			private readonly IConfiguration _configuration;
			
			/// <summary>
			/// A logger factory used to create a logger for the plugin manager.
			/// </summary>
			private readonly ILoggerFactory _loggerFactory;

			
			/// <summary>
			/// Create a new <see cref="HostServiceProvider"/> that will return given services when asked.
			/// </summary>
			/// <param name="hostEnvironment">
			/// The host environment that could be used by plugins to configure themself.
			/// </param>
			/// <param name="configuration">The configuration context</param>
			/// <param name="loggerFactory">A logger factory used to create a logger for the plugin manager.</param>
			public HostServiceProvider(IWebHostEnvironment hostEnvironment,
				IConfiguration configuration,
				ILoggerFactory loggerFactory)
			{
				_hostEnvironment = hostEnvironment;
				_configuration = configuration;
				_loggerFactory = loggerFactory;
			}

			/// <inheritdoc />
			public object GetService(Type serviceType)
			{
				if (serviceType == typeof(IWebHostEnvironment) || serviceType == typeof(IHostEnvironment))
					return _hostEnvironment;
				if (serviceType == typeof(IConfiguration))
					return _configuration;
				if (serviceType.GetGenericTypeDefinition() == typeof(ILogger<>))
				{
					return Utility.RunGenericMethod<object>(
						typeof(LoggerFactoryExtensions),
						nameof(LoggerFactoryExtensions.CreateLogger),
						serviceType.GetGenericArguments().First(),
						_loggerFactory
					);
				}

				return null;
			}
		}
	}
}
