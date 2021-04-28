using System;
using System.IO;
using System.Reflection;
using IdentityServer4.Extensions;
using IdentityServer4.Services;
using Kyoo.Api;
using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SpaServices.AngularCli;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
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
		private readonly ILoggerFactory _loggerFactory;


		public Startup(IConfiguration configuration, ILoggerFactory loggerFactory)
		{
			_configuration = configuration;
			_loggerFactory = loggerFactory;
		}

		public void ConfigureServices(IServiceCollection services)
		{
			string publicUrl = _configuration.GetValue<string>("public_url");

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

			services.AddDbContext<DatabaseContext>(options =>
			{
				options.UseNpgsql(_configuration.GetDatabaseConnection());
				// .EnableSensitiveDataLogging()
				// .UseLoggerFactory(LoggerFactory.Create(builder => builder.AddConsole()));
			}, ServiceLifetime.Transient);
			
			services.AddDbContext<IdentityDatabase>(options =>
			{
				options.UseNpgsql(_configuration.GetDatabaseConnection());
			});

			string assemblyName = typeof(Startup).GetTypeInfo().Assembly.GetName().Name;

			services.AddIdentityCore<User>(o =>
				{
					o.Stores.MaxLengthForKeys = 128;
				})
				.AddSignInManager()
				.AddDefaultTokenProviders()
				.AddEntityFrameworkStores<IdentityDatabase>();

			services.AddIdentityServer(options =>
				{
					options.IssuerUri = publicUrl;
					options.UserInteraction.LoginUrl = publicUrl + "login";
					options.UserInteraction.ErrorUrl = publicUrl + "error";
					options.UserInteraction.LogoutUrl = publicUrl + "logout";
				})
				.AddAspNetIdentity<User>()
				.AddConfigurationStore(options =>
				{
					options.ConfigureDbContext = builder =>
						builder.UseNpgsql(_configuration.GetDatabaseConnection(),
							sql => sql.MigrationsAssembly(assemblyName));
				})
				.AddOperationalStore(options =>
				{
					options.ConfigureDbContext = builder =>
						builder.UseNpgsql(_configuration.GetDatabaseConnection(),
							sql => sql.MigrationsAssembly(assemblyName));
					options.EnableTokenCleanup = true;
				})
				.AddInMemoryIdentityResources(IdentityContext.GetIdentityResources())
				.AddInMemoryApiScopes(IdentityContext.GetScopes())
				.AddInMemoryApiResources(IdentityContext.GetApis())
				.AddProfileService<AccountController>()
				.AddSigninKeys(_configuration);
			
			services.AddAuthentication(o =>
				{
					o.DefaultScheme = IdentityConstants.ApplicationScheme;
					o.DefaultSignInScheme = IdentityConstants.ExternalScheme;
				})
				.AddIdentityCookies(_ => { });
			services.AddAuthentication()
				.AddJwtBearer(options =>
				{
					options.Authority = publicUrl;
					options.Audience = "Kyoo";
					options.RequireHttpsMetadata = false;
				});

			services.AddAuthorization(options =>
			{
				AuthorizationPolicyBuilder scheme = new(IdentityConstants.ApplicationScheme, JwtBearerDefaults.AuthenticationScheme);
				options.DefaultPolicy = scheme.RequireAuthenticatedUser().Build();

				string[] permissions = {"Read", "Write", "Play", "Admin"};
				foreach (string permission in permissions)
				{
					options.AddPolicy(permission, policy =>
					{
						policy.AuthenticationSchemes.Add(IdentityConstants.ApplicationScheme);
						policy.AuthenticationSchemes.Add(JwtBearerDefaults.AuthenticationScheme);
						policy.AddRequirements(new AuthorizationValidator(permission));
						// policy.RequireScope($"kyoo.{permission.ToLower()}");
					});
				}
			});
			services.AddSingleton<IAuthorizationHandler, AuthorizationValidatorHandler>();
			
			services.AddSingleton<ICorsPolicyService>(new DefaultCorsPolicyService(_loggerFactory.CreateLogger<DefaultCorsPolicyService>())
			{
				AllowedOrigins = { new Uri(publicUrl).GetLeftPart(UriPartial.Authority) }
			});
			
			
			services.AddScoped<DbContext, DatabaseContext>();
		}
		
		public void Configure(IUnityContainer container, IApplicationBuilder app, IWebHostEnvironment env)
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
			app.UseCookiePolicy(new CookiePolicyOptions
			{
				MinimumSameSitePolicy = SameSiteMode.Strict
			});
			app.UseAuthentication();
			app.Use((ctx, next) =>
			{
				ctx.SetIdentityServerOrigin(_configuration.GetValue<string>("public_url"));
				return next();
			});
			app.UseIdentityServer();
			app.UseAuthorization();

			app.UseEndpoints(endpoints =>
			{
				endpoints.MapControllerRoute("Kyoo", "api/{controller=Home}/{action=Index}/{id?}");
			});

			app.UseSpa(spa =>
			{
				spa.Options.SourcePath = Path.Join(AppDomain.CurrentDomain.BaseDirectory, "Kyoo.WebApp");

				if (env.IsDevelopment())
					spa.UseAngularCliServer("start");
			});
			
			new CoreModule().Configure(container, _configuration, app, env.IsDevelopment());
			container.RegisterFactory<IHostedService>(c => c.Resolve<ITaskManager>(), new SingletonLifetimeManager());
			// TODO the reload should re inject components from the constructor.
			// TODO fin a way to inject tasks without a IUnityContainer.
		}
	}
}
