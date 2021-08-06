using System;
using System.IO;
using Autofac;
using Autofac.Extras.AttributeMetadata;
using Kyoo.Authentication;
using Kyoo.Controllers;
using Kyoo.Models.Options;
using Kyoo.Postgresql;
using Kyoo.Tasks;
using Kyoo.TheMovieDb;
using Kyoo.TheTvdb;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.SpaServices.AngularCli;
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
	public class Startup
	{
		/// <summary>
		/// A plugin manager used to load plugins and allow them to configure services / asp net.
		/// </summary>
		private readonly IPluginManager _plugins;


		/// <summary>
		/// Created from the DI container, those services are needed to load information and instantiate plugins.s
		/// </summary>
		/// <param name="hostEnvironment">
		/// The host environment that could be used by plugins to configure themself.
		/// </param>
		/// <param name="configuration">The configuration context</param>
		/// <param name="loggerFactory">A logger factory used to create a logger for the plugin manager.</param>
		public Startup(IWebHostEnvironment hostEnvironment, 
			IConfiguration configuration, 
			ILoggerFactory loggerFactory)
		{
			HostServiceProvider hostProvider = new(hostEnvironment, configuration, loggerFactory);
			_plugins = new PluginManager(
				hostProvider, 
				Options.Create(configuration.GetSection(BasicOptions.Path).Get<BasicOptions>()),
				loggerFactory.CreateLogger<PluginManager>()
			);
			
			// TODO maybe keep all core-plugins here to simplify the build process but use their typeof in the method
			// (to allow simple constructor changes), leaving the instantiation responsibility to the plugin manager.
			_plugins.LoadPlugins(new IPlugin[] {
				new CoreModule(configuration), 
				new PostgresModule(configuration, hostEnvironment),
				// new SqLiteModule(configuration, host),
				new AuthenticationModule(configuration, loggerFactory, hostEnvironment),
				new PluginTvdb(configuration),
				new PluginTmdb(configuration)
			});
		}

		/// <summary>
		/// Configure the services context via the <see cref="PluginManager"/>.
		/// </summary>
		/// <param name="services">The service collection to fill.</param>
		public void ConfigureServices(IServiceCollection services)
		{
			services.AddMvc().AddControllersAsServices();
			
			services.AddSpaStaticFiles(configuration =>
			{
				configuration.RootPath = Path.Join(AppDomain.CurrentDomain.BaseDirectory, "wwwroot");
			});
			services.AddResponseCompression(x =>
			{
				x.EnableForHttps = true;
			});
			
			services.AddHttpClient();
			
			_plugins.ConfigureServices(services);
		}

		/// <summary>
		/// Configure the autofac container via the <see cref="PluginManager"/>.
		/// </summary>
		/// <param name="builder">The builder to configure.</param>
		public void ConfigureContainer(ContainerBuilder builder)
		{
			builder.RegisterModule<AttributedMetadataModule>();
			builder.RegisterInstance(_plugins).As<IPluginManager>().ExternallyOwned();
			builder.RegisterTask<PluginInitializer>();
			_plugins.ConfigureContainer(builder);
		}
		
		/// <summary>
		/// Configure the asp net host.
		/// </summary>
		/// <param name="app">The asp net host to configure</param>
		/// <param name="env">The host environment (is the app in development mode?)</param>
		public void Configure(IApplicationBuilder app, IWebHostEnvironment env, IServiceProvider provider)
		{
			if (env.IsDevelopment())
				app.UseDeveloperExceptionPage();
			else
			{
				app.UseExceptionHandler("/error");
				app.UseHsts();
			}
			
			if (!env.IsDevelopment())
				app.UseSpaStaticFiles();

			app.UseRouting();
			app.Use((ctx, next) => 
			{
				ctx.Response.Headers.Remove("X-Powered-By");
				ctx.Response.Headers.Remove("Server");
				ctx.Response.Headers.Add("Feature-Policy", "autoplay 'self'; fullscreen");
				ctx.Response.Headers.Add("Content-Security-Policy", "default-src 'self' blob:; script-src 'self' blob: 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; frame-src 'self' https://www.youtube.com");
				ctx.Response.Headers.Add("X-Frame-Options", "SAMEORIGIN");
				ctx.Response.Headers.Add("Referrer-Policy", "no-referrer");
				ctx.Response.Headers.Add("Access-Control-Allow-Origin", "null");
				ctx.Response.Headers.Add("X-Content-Type-Options", "nosniff");
				return next();
			});
			app.UseResponseCompression();

			if (_plugins is PluginManager manager)
				manager.SetProvider(provider);
			_plugins.ConfigureAspnet(app);

			app.UseSpa(spa =>
			{
				spa.Options.SourcePath = Path.Join(AppDomain.CurrentDomain.BaseDirectory, "Kyoo.WebApp");
			
				if (env.IsDevelopment())
					spa.UseAngularCliServer("start");
			});
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
				if (serviceType == typeof(ILoggerFactory))
					return _loggerFactory;
				return null;
			}
		}
	}
}
