using System;
using System.Reflection;
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
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Kyoo
{
	public class Startup
	{
		private readonly IConfiguration _configuration;
		private readonly ILoggerFactory _loggerFactory;


		public Startup(IConfiguration configuration, ILoggerFactory loggerFactory)
		{
			_configuration = configuration;
			_loggerFactory = loggerFactory;
		}


		// This method gets called by the runtime. Use this method to add services to the container.
		public void ConfigureServices(IServiceCollection services)
		{
			services.AddSpaStaticFiles(configuration =>
			{
				configuration.RootPath = "wwwroot";
			});
			
			services.AddControllers().AddNewtonsoftJson();
			services.AddHttpClient();

			services.AddSingleton<DatabaseFactory>(x => new DatabaseFactory(
				new DbContextOptionsBuilder<DatabaseContext>()
					.UseLazyLoadingProxies()
					.UseSqlite(_configuration.GetConnectionString("Database")).Options));
			
			services.AddDbContext<DatabaseContext>(options =>
			{
				options.UseLazyLoadingProxies()
					.UseSqlite(_configuration.GetConnectionString("Database"))
					.EnableSensitiveDataLogging();
				//.UseLoggerFactory(LoggerFactory.Create(builder => builder.AddConsole()));
			});
			
			services.AddDbContext<IdentityDatabase>(options =>
			{
				options.UseSqlite(_configuration.GetConnectionString("Database"));
			});

			string assemblyName = typeof(Startup).GetTypeInfo().Assembly.GetName().Name;
			string publicUrl = _configuration.GetValue<string>("public_url");

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
					options.PublicOrigin = publicUrl;
					options.UserInteraction.LoginUrl = publicUrl + "login";
					options.UserInteraction.ErrorUrl = publicUrl + "error";
					options.UserInteraction.LogoutUrl = publicUrl + "logout";
				})
				.AddAspNetIdentity<User>()
				.AddConfigurationStore(options =>
				{
					options.ConfigureDbContext = builder =>
						builder.UseSqlite(_configuration.GetConnectionString("Database"),
							sql => sql.MigrationsAssembly(assemblyName));
				})
				.AddOperationalStore(options =>
				{
					options.ConfigureDbContext = builder =>
						builder.UseSqlite(_configuration.GetConnectionString("Database"),
							sql => sql.MigrationsAssembly(assemblyName));
					options.EnableTokenCleanup = true;
				})
				.AddInMemoryIdentityResources(IdentityContext.GetIdentityResources())
				.AddInMemoryApiResources(IdentityContext.GetApis())
				.AddProfileService<AccountController>()
				.AddSigninKeys(_configuration);
			
			services.AddAuthentication(o =>
				{
					o.DefaultScheme = IdentityConstants.ApplicationScheme;
					o.DefaultSignInScheme = IdentityConstants.ExternalScheme;
				})
				.AddIdentityCookies(o => { });
			services.AddAuthentication()
				.AddJwtBearer(options =>
				{
					options.Authority = publicUrl;
					options.Audience = "Kyoo";
					options.RequireHttpsMetadata = false;
				});

			services.AddAuthorization(options =>
			{
				AuthorizationPolicyBuilder scheme = new AuthorizationPolicyBuilder(IdentityConstants.ApplicationScheme, JwtBearerDefaults.AuthenticationScheme);
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

			services.AddScoped<ILibraryManager, LibraryManager>();
			services.AddSingleton<ITranscoder, Transcoder>();
			services.AddSingleton<IThumbnailsManager, ThumbnailsManager>();
			services.AddSingleton<IProviderManager, ProviderManager>();
			services.AddSingleton<IPluginManager, PluginManager>();
			services.AddSingleton<ITaskManager, TaskManager>();
			
			services.AddHostedService<TaskManager>(provider => (TaskManager)provider.GetService<ITaskManager>());
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

			app.UseStaticFiles();
			if (!env.IsDevelopment())
				app.UseSpaStaticFiles();

			app.UseRouting();

			app.UseAuthentication();
			app.UseIdentityServer();
			app.UseAuthorization();
			app.UseCookiePolicy(new CookiePolicyOptions 
			{
				MinimumSameSitePolicy = SameSiteMode.Lax
			});

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
