using System;
using System.IO;
using Kyoo.Controllers;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Unity;
using Unity.Lifetime;

namespace Kyoo
{
	/// <summary>
	/// The Startup class is used to configure the AspNet's webhost.
	/// </summary>
	public class Startup
	{
		private readonly IConfiguration _configuration;


		public Startup(IConfiguration configuration)
		{
			_configuration = configuration;
		}

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
			
			// services.AddAuthorization(options =>
			// {
			// 	string[] permissions = {"Read", "Write", "Play", "Admin"};
			// 	foreach (string permission in permissions)
			// 		options.AddPolicy(permission, policy =>
			// 		{
			// 			policy.AddRequirements(new AuthorizationValidator(permission));
			// 		});
			// });
			// services.AddAuthentication()

			services.AddSingleton<ITaskManager, TaskManager>();
			services.AddHostedService(x => x.GetService<ITaskManager>() as TaskManager);
		}

		public void ConfigureContainer(UnityContainer container) { }
		
		public void Configure(IUnityContainer container, IApplicationBuilder app, IWebHostEnvironment env)
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
			app.UseStaticFiles(new StaticFileOptions
			{
				ContentTypeProvider = contentTypeProvider,
				FileProvider = new PhysicalFileProvider(Path.Join(AppDomain.CurrentDomain.BaseDirectory, "wwwroot"))
			});
			if (!env.IsDevelopment())
				app.UseSpaStaticFiles();

			app.UseRouting();
			// app.UseAuthorization();

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

			// app.UseSpa(spa =>
			// {
			// 	spa.Options.SourcePath = Path.Join(AppDomain.CurrentDomain.BaseDirectory, "Kyoo.WebApp");
			//
			// 	if (env.IsDevelopment())
			// 		spa.UseAngularCliServer("start");
			// });
			//
			container.RegisterType<IPluginManager, PluginManager>(new SingletonLifetimeManager());
			// container.Resolve<IConfiguration>();
			IPluginManager pluginManager = container.Resolve<IPluginManager>();
			pluginManager.ReloadPlugins();
			foreach (IPlugin plugin in pluginManager.GetAllPlugins())
				plugin.ConfigureAspNet(app);
			
			app.UseEndpoints(endpoints =>
			{
				endpoints.MapControllerRoute("Kyoo", "api/{controller=Home}/{action=Index}/{id?}");
			});
		}
	}
}
