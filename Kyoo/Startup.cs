using System.Reflection;
using Kyoo.Api;
using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SpaServices.AngularCli;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Kyoo
{
	public class Startup
	{
		public Startup(IConfiguration configuration)
		{
			Configuration = configuration;
		}

		public IConfiguration Configuration { get; }

		// This method gets called by the runtime. Use this method to add services to the container.
		public void ConfigureServices(IServiceCollection services)
		{
			services.AddSpaStaticFiles(configuration =>
			{
				configuration.RootPath = "wwwroot";
			});
			
			services.AddControllers().AddNewtonsoftJson();
			services.AddHttpClient();

			services.AddDbContext<DatabaseContext>(options =>
			{
				options.UseLazyLoadingProxies()
					.UseSqlite(Configuration.GetConnectionString("Database"));
			});

			string assemblyName = typeof(Startup).GetTypeInfo().Assembly.GetName().Name;
			string publicUrl = Configuration.GetValue<string>("public_url");

			services.AddDefaultIdentity<User>()
				.AddEntityFrameworkStores<DatabaseContext>();

			services.AddIdentityServer(options =>
				{
					options.UserInteraction.LoginUrl = publicUrl + "login";
					options.UserInteraction.ErrorUrl = publicUrl + "error";
					options.UserInteraction.LogoutUrl = publicUrl + "logout";
				})
				.AddAspNetIdentity<User>()
				.AddSigningCredentials()
				.AddConfigurationStore(options =>
				{
					options.ConfigureDbContext = builder =>
						builder.UseSqlite(Configuration.GetConnectionString("Database"),
							sql => sql.MigrationsAssembly(assemblyName));
				})
				.AddOperationalStore(options =>
				{
					options.ConfigureDbContext = builder =>
						builder.UseSqlite(Configuration.GetConnectionString("Database"),
							sql => sql.MigrationsAssembly(assemblyName));
					options.EnableTokenCleanup = true;
				})
				.AddInMemoryIdentityResources(IdentityContext.GetIdentityResources())
				.AddInMemoryApiResources(IdentityContext.GetApis())
				.AddProfileService<AccountController>()
				.AddDeveloperSigningCredential(); // TODO remove the developer signin

			services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
				.AddJwtBearer(options =>
				{
					options.Authority = publicUrl;
					options.Audience = "Kyoo";
					options.RequireHttpsMetadata = false;
				});
			
			services.AddAuthorization(options =>
			{
				options.AddPolicy("Read", policy => policy.RequireScope("kyoo.read").RequireClaim("kyoo.read")); //Checked from the access token so kyoo.read is not here but it is inside the permissions string-array.
				options.AddPolicy("Write", policy => policy.RequireScope("kyoo.write").RequireClaim("kyoo.write"));
				options.AddPolicy("Play", policy => policy.RequireScope("kyoo.play").RequireClaim("kyoo.play"));
				options.AddPolicy("Download", policy => policy.RequireScope("kyoo.download").RequireClaim("kyoo.download"));
				options.AddPolicy("Admin", policy => policy.RequireScope("kyoo.admin").RequireClaim("kyoo.admin"));
			});

			services.AddScoped<ILibraryManager, LibraryManager>();
			services.AddScoped<ICrawler, Crawler>();
			services.AddSingleton<ITranscoder, Transcoder>();
			services.AddSingleton<IThumbnailsManager, ThumbnailsManager>();
			services.AddSingleton<IProviderManager, ProviderManager>();
			services.AddSingleton<IPluginManager, PluginManager>();
			
			services.AddHostedService<StartupCode>();
		}

		// This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
		public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
		{
			if (env.IsDevelopment())
			{
				app.UseDeveloperExceptionPage();
			}
			else
			{
				app.UseExceptionHandler("/Error");
				app.UseHsts();
			}

			app.Use((ctx, next) => 
			{
				ctx.Response.Headers.Remove("X-Powered-By");
				ctx.Response.Headers.Remove("Server");
				ctx.Response.Headers.Add("Feature-Policy", "autoplay 'self'; fullscreen");
				ctx.Response.Headers.Add("Content-Security-Policy", "default-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; style-src 'self' 'unsafe-inline'");
				ctx.Response.Headers.Add("X-Frame-Options", "SAMEORIGIN");
				ctx.Response.Headers.Add("Referrer-Policy", "no-referrer");
				ctx.Response.Headers.Add("Access-Control-Allow-Origin", "null");
				ctx.Response.Headers.Add("X-Content-Type-Options", "nosniff");
				return next();
			});
			
			app.UseStaticFiles();
			if (!env.IsDevelopment())
				app.UseSpaStaticFiles();

			app.UseRouting();

			app.UseAuthentication();
			app.UseIdentityServer();
			app.UseAuthorization();
			
			app.UseEndpoints(endpoints =>
			{
				endpoints.MapControllerRoute("Kyoo", "api/{controller=Home}/{action=Index}/{id?}");
			});

			app.UseSpa(spa =>
			{
				spa.Options.SourcePath = "Views/WebClient";

				if (env.IsDevelopment())
				{
					spa.UseAngularCliServer("start");
				}
			});
		}
	}
}
