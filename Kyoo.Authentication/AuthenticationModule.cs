using System;
using System.Collections.Generic;
using System.Linq;
using IdentityServer4.Extensions;
using IdentityServer4.Models;
using IdentityServer4.Services;
using Kyoo.Authentication.Models;
using Kyoo.Authentication.Views;
using Kyoo.Controllers;
using Kyoo.Models.Permissions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Logging;

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
		public ICollection<Type> Requires => new []
		{
			typeof(IUserRepository)
		};
		
		
		/// <summary>
		/// The configuration to use.
		/// </summary>
		private readonly IConfiguration _configuration;

		/// <summary>
		/// A logger factory to allow IdentityServer to log things.
		/// </summary>
		private readonly ILoggerFactory _loggerFactory;

		/// <summary>
		/// The environment information to check if the app runs in debug mode
		/// </summary>
		private readonly IWebHostEnvironment _environment;


		/// <summary>
		/// Create a new authentication module instance and use the given configuration and environment.
		/// </summary>
		/// <param name="configuration">The configuration to use</param>
		/// <param name="loggerFactory">The logger factory to allow IdentityServer to log things</param>
		/// <param name="environment">The environment information to check if the app runs in debug mode</param>
		public AuthenticationModule(IConfiguration configuration,
			ILoggerFactory loggerFactory, 
			IWebHostEnvironment environment)
		{
			_configuration = configuration;
			_loggerFactory = loggerFactory;
			_environment = environment;
		}

		/// <inheritdoc />
		public void Configure(IServiceCollection services, ICollection<Type> availableTypes)
		{
			string publicUrl = _configuration.GetValue<string>("public_url").TrimEnd('/');

			if (_environment.IsDevelopment())
				IdentityModelEventSource.ShowPII = true;

			services.AddControllers();
			
			// TODO handle direct-videos with bearers (probably add a cookie and a app.Use to translate that for videos)
			
			// TODO Check if tokens should be stored.
			
			services.Configure<PermissionOption>(_configuration.GetSection(PermissionOption.Path));
			services.Configure<CertificateOption>(_configuration.GetSection(CertificateOption.Path));
			services.Configure<AuthenticationOption>(_configuration.GetSection(AuthenticationOption.Path));
			
			
			List<Client> clients = new();
			_configuration.GetSection("authentication:clients").Bind(clients);
			CertificateOption certificateOptions = new();
			_configuration.GetSection(CertificateOption.Path).Bind(certificateOptions);
			
			services.AddIdentityServer(options =>
				{
					options.IssuerUri = publicUrl;
					options.UserInteraction.LoginUrl = $"{publicUrl}/login";
					options.UserInteraction.ErrorUrl = $"{publicUrl}/error";
					options.UserInteraction.LogoutUrl = $"{publicUrl}/logout";
				})
				.AddInMemoryIdentityResources(IdentityContext.GetIdentityResources())
				.AddInMemoryApiScopes(IdentityContext.GetScopes())
				.AddInMemoryApiResources(IdentityContext.GetApis())
				.AddInMemoryClients(IdentityContext.GetClients().Concat(clients))
				.AddProfileService<AccountApi>()
				.AddSigninKeys(certificateOptions);
			
			services.AddAuthentication()
				.AddJwtBearer(options =>
				{
					options.Authority = publicUrl;
					options.Audience = "kyoo";
					options.RequireHttpsMetadata = false;
				});
			services.AddSingleton<IPermissionValidator, PermissionValidatorFactory>();

			DefaultCorsPolicyService cors = new(_loggerFactory.CreateLogger<DefaultCorsPolicyService>())
			{
				AllowedOrigins = {new Uri(publicUrl).GetLeftPart(UriPartial.Authority)}
			}; 
			services.AddSingleton<ICorsPolicyService>(cors);
		}

		/// <inheritdoc />
		public void ConfigureAspNet(IApplicationBuilder app)
		{
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
		}
	}
}