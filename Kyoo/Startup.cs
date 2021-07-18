using System;
using System.IO;
using Autofac;
using Kyoo.Authentication;
using Kyoo.Controllers;
using Kyoo.Models.Options;
using Kyoo.Postgresql;
using Kyoo.Tasks;
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
		/// <param name="hostProvider">
		/// The ServiceProvider used to create this <see cref="Startup"/> instance.
		/// The host provider that contains only well-known services that are Kyoo independent.
		/// This is used to instantiate plugins that might need a logger, a configuration or an host environment.
		/// </param>
		/// <param name="configuration">The configuration context</param>
		/// <param name="loggerFactory">A logger factory used to create a logger for the plugin manager.</param>
		public Startup(IServiceProvider hostProvider, IConfiguration configuration, ILoggerFactory loggerFactory, IWebHostEnvironment host)
		{
			IOptionsMonitor<BasicOptions> options = hostProvider.GetService<IOptionsMonitor<BasicOptions>>();
			_plugins = new PluginManager(hostProvider, options, loggerFactory.CreateLogger<PluginManager>());
			
			// TODO remove postgres from here and load it like a normal plugin.
			_plugins.LoadPlugins(new IPlugin[] {
				new CoreModule(configuration), 
				new PostgresModule(configuration, host),
				// new SqLiteModule(configuration, host),
				new AuthenticationModule(configuration, loggerFactory, host)
			});
		}

		/// <summary>
		/// Configure the WebApp services context.
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

		public void ConfigureContainer(ContainerBuilder builder)
		{
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
	}
}
