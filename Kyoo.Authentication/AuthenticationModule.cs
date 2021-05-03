using System;
using System.Collections.Generic;
using IdentityServer4.Extensions;
using IdentityServer4.Services;
using Kyoo.Authentication.Models;
using Kyoo.Controllers;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Kyoo.Authentication
{
	/// <summary>
	/// A module that enable OpenID authentication for Kyoo.
	/// </summary>
	public class AuthenticationModule : IPlugin
	{
		/// <inheritdoc />
		public string Slug => "auth";
		
		/// <inheritdoc />
		public string Name => "Authentication";
		
		/// <inheritdoc />
		public string Description => "Enable OpenID authentication for Kyoo.";
		
		/// <inheritdoc />
		public ICollection<Type> Provides => ArraySegment<Type>.Empty;
		
		/// <inheritdoc />
		public ICollection<ConditionalProvide> ConditionalProvides => ArraySegment<ConditionalProvide>.Empty;
		
		/// <inheritdoc />
		public ICollection<Type> Requires => ArraySegment<Type>.Empty;
		
		
		/// <summary>
		/// The configuration to use.
		/// </summary>
		private readonly IConfiguration _configuration;

		/// <summary>
		/// A logger factory to allow IdentityServer to log things.
		/// </summary>
		private readonly ILoggerFactory _loggerFactory;

		
		/// <summary>
		/// Create a new authentication module instance and use the given configuration and environment.
		/// </summary>
		/// <param name="configuration">The configuration to use</param>
		/// <param name="loggerFactory">The logger factory to allow IdentityServer to log things</param>
		public AuthenticationModule(IConfiguration configuration, ILoggerFactory loggerFactory)
		{
			_configuration = configuration;
			_loggerFactory = loggerFactory;
		}

		/// <inheritdoc />
		public void Configure(IServiceCollection services, ICollection<Type> availableTypes)
		{
			string publicUrl = _configuration.GetValue<string>("public_url");

			// services.AddDbContext<IdentityDatabase>(options =>
			// {
			// 	options.UseNpgsql(_configuration.GetDatabaseConnection("postgres"));
			// });

			// services.AddIdentityCore<User>(o =>
			// 	{
			// 		o.Stores.MaxLengthForKeys = 128;
			// 	})
			// 	.AddSignInManager()
			// 	.AddDefaultTokenProviders()
			// 	.AddEntityFrameworkStores<IdentityDatabase>();

			CertificateOption certificateOptions = new();
			_configuration.GetSection(CertificateOption.Path).Bind(certificateOptions);
			services.AddIdentityServer(options =>
				{
					options.IssuerUri = publicUrl;
					options.UserInteraction.LoginUrl = publicUrl + "login";
					options.UserInteraction.ErrorUrl = publicUrl + "error";
					options.UserInteraction.LogoutUrl = publicUrl + "logout";
				})
				// .AddAspNetIdentity<User>()
				// .AddConfigurationStore(options =>
				// {
				// 	options.ConfigureDbContext = builder =>
				// 		builder.UseNpgsql(_configuration.GetDatabaseConnection("postgres"),
				// 			sql => sql.MigrationsAssembly(assemblyName));
				// })
				// .AddOperationalStore(options =>
				// {
				// 	options.ConfigureDbContext = builder =>
				// 		builder.UseNpgsql(_configuration.GetDatabaseConnection("postgres"),
				// 			sql => sql.MigrationsAssembly(assemblyName));
				// 	options.EnableTokenCleanup = true;
				// })
				.AddInMemoryIdentityResources(IdentityContext.GetIdentityResources())
				.AddInMemoryApiScopes(IdentityContext.GetScopes())
				.AddInMemoryApiResources(IdentityContext.GetApis())
				.AddInMemoryClients(IdentityContext.GetClients())
				// .AddProfileService<AccountController>()
				.AddSigninKeys(certificateOptions);

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
				AuthorizationPolicyBuilder scheme = new(IdentityConstants.ApplicationScheme, 
					JwtBearerDefaults.AuthenticationScheme);
				options.DefaultPolicy = scheme.RequireAuthenticatedUser().Build();
			
				string[] permissions = {"Read", "Write", "Play", "Admin"};
				foreach (string permission in permissions)
				{
					options.AddPolicy(permission, policy =>
					{
						policy.AuthenticationSchemes.Add(IdentityConstants.ApplicationScheme);
						policy.AuthenticationSchemes.Add(JwtBearerDefaults.AuthenticationScheme);
						policy.AddRequirements(new AuthorizationValidator(permission));
						policy.RequireScope($"kyoo.{permission.ToLower()}");
					});
				}
			});
			services.AddSingleton<IAuthorizationHandler, AuthorizationValidatorHandler>();

			DefaultCorsPolicyService cors = new(_loggerFactory.CreateLogger<DefaultCorsPolicyService>())
			{
				AllowedOrigins = {new Uri(publicUrl).GetLeftPart(UriPartial.Authority)}
			}; 
			services.AddSingleton<ICorsPolicyService>(cors);
		}

		/// <inheritdoc />
		public void ConfigureAspNet(IApplicationBuilder app)
		{
			app.UseAuthorization();

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
		}
	}
}