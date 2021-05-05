using System;
using System.IO;
using Kyoo.Controllers;
using Kyoo.Models;
using Kyoo.Postgresql;
using Kyoo.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.SpaServices.AngularCli;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Kyoo
{
	/// <summary>
	/// The Startup class is used to configure the AspNet's webhost.
	/// </summary>
	public class Startup
	{
		/// <summary>
		/// The configuration context
		/// </summary>
		private readonly IConfiguration _configuration;
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
			_configuration = configuration;
			_plugins = new PluginManager(hostProvider, _configuration, loggerFactory.CreateLogger<PluginManager>());
			
			_plugins.LoadPlugins(new IPlugin[] {new CoreModule(), new PostgresModule(configuration, host)});
		}

		/// <summary>
		/// Configure the WebApp services context.
		/// </summary>
		/// <param name="services">The service collection to fill.</param>
		public void ConfigureServices(IServiceCollection services)
		{
			string publicUrl = _configuration.GetValue<string>("public_url");

			services.AddMvc().AddControllersAsServices();
			
			services.AddSpaStaticFiles(configuration =>
			{
				configuration.RootPath = Path.Join(AppDomain.CurrentDomain.BaseDirectory, "wwwroot");
			});
			services.AddResponseCompression(x =>
			{
				x.EnableForHttps = true;
			});

			services.AddControllers()
				.AddNewtonsoftJson(x =>
				{
					x.SerializerSettings.ContractResolver = new JsonPropertyIgnorer(publicUrl);
					x.SerializerSettings.Converters.Add(new PeopleRoleConverter());
				});
			services.AddHttpClient();
			
			services.AddTransient(typeof(Lazy<>), typeof(LazyDi<>));
			
			services.AddSingleton(_plugins);
			services.AddTask<PluginInitializer>();
			_plugins.ConfigureServices(services);
		}
		
		/// <summary>
		/// Configure the asp net host.
		/// </summary>
		/// <param name="app">The asp net host to configure</param>
		/// <param name="env">The host environment (is the app in development mode?)</param>
		public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
		{
			if (env.IsDevelopment())
				app.UseDeveloperExceptionPage();
			else
			{
				app.UseExceptionHandler("/Error");
				app.UseHsts();
			}

			FileExtensionContentTypeProvider contentTypeProvider = new();
			contentTypeProvider.Mappings[".data"] = "application/octet-stream";
			app.UseDefaultFiles();
			app.UseStaticFiles(new StaticFileOptions
			{
				ContentTypeProvider = contentTypeProvider,
				FileProvider = new PhysicalFileProvider(Path.Join(AppDomain.CurrentDomain.BaseDirectory, "wwwroot"))
			});
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

			app.UseSpa(spa =>
			{
				spa.Options.SourcePath = Path.Join(AppDomain.CurrentDomain.BaseDirectory, "Kyoo.WebApp");
			
				if (env.IsDevelopment())
					spa.UseAngularCliServer("start");
			});
			
			_plugins.ConfigureAspnet(app);
			
			app.UseEndpoints(endpoints =>
			{
				endpoints.MapControllerRoute("Kyoo", "api/{controller=Home}/{action=Index}/{id?}");
			});
		}
	}
}
