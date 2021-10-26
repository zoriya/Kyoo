// Kyoo - A portable and vast media library solution.
// Copyright (c) Kyoo.
//
// See AUTHORS.md and LICENSE file in the project root for full license information.
//
// Kyoo is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// any later version.
//
// Kyoo is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Kyoo. If not, see <https://www.gnu.org/licenses/>.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.IO;
using System.Linq;
using System.Reflection;
using Autofac;
using IdentityServer4.Extensions;
using IdentityServer4.Models;
using IdentityServer4.Services;
using Kyoo.Abstractions;
using Kyoo.Abstractions.Controllers;
using Kyoo.Authentication.Models;
using Kyoo.Authentication.Views;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Logging;
using SameSiteMode = Microsoft.AspNetCore.Http.SameSiteMode;

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
		public Dictionary<string, Type> Configuration => new()
		{
			{ AuthenticationOption.Path, typeof(AuthenticationOption) },
			{ PermissionOption.Path, typeof(PermissionOption) },
			{ CertificateOption.Path, typeof(CertificateOption) }
		};

		/// <summary>
		/// The configuration to use.
		/// </summary>
		private readonly IConfiguration _configuration;

		/// <summary>
		/// The logger used to allow IdentityServer to log things.
		/// </summary>
		private readonly ILogger<DefaultCorsPolicyService> _logger;

		/// <summary>
		/// The environment information to check if the app runs in debug mode
		/// </summary>
		private readonly IWebHostEnvironment _environment;

		/// <summary>
		/// Create a new authentication module instance and use the given configuration and environment.
		/// </summary>
		/// <param name="configuration">The configuration to use</param>
		/// <param name="logger">The logger used to allow IdentityServer to log things</param>
		/// <param name="environment">The environment information to check if the app runs in debug mode</param>
		[SuppressMessage("ReSharper", "ContextualLoggerProblem",
			Justification = "The logger is used for a dependency that is not created via the container.")]
		public AuthenticationModule(IConfiguration configuration,
			ILogger<DefaultCorsPolicyService> logger,
			IWebHostEnvironment environment)
		{
			_configuration = configuration;
			_logger = logger;
			_environment = environment;
		}

		/// <inheritdoc />
		public void Configure(ContainerBuilder builder)
		{
			builder.RegisterType<PermissionValidator>().As<IPermissionValidator>().SingleInstance();

			DefaultCorsPolicyService cors = new(_logger)
			{
				AllowedOrigins = { _configuration.GetPublicUrl().GetLeftPart(UriPartial.Authority) }
			};
			builder.RegisterInstance(cors).As<ICorsPolicyService>().SingleInstance();
		}

		/// <inheritdoc />
		public void Configure(IServiceCollection services)
		{
			Uri publicUrl = _configuration.GetPublicUrl();

			if (_environment.IsDevelopment())
				IdentityModelEventSource.ShowPII = true;

			services.AddControllers();

			// TODO handle direct-videos with bearers (probably add a cookie and a app.Use to translate that for videos)
			// TODO Check if tokens should be stored.
			List<Client> clients = new();
			_configuration.GetSection("authentication:clients").Bind(clients);
			CertificateOption certificateOptions = new();
			_configuration.GetSection(CertificateOption.Path).Bind(certificateOptions);

			clients.AddRange(IdentityContext.GetClients());
			foreach (Client client in clients)
			{
				client.RedirectUris = client.RedirectUris
					.Select(x => x.StartsWith("/") ? publicUrl.ToString().TrimEnd('/') + x : x)
					.ToArray();
			}

			services.AddIdentityServer(options =>
				{
					options.IssuerUri = publicUrl.ToString();
					options.UserInteraction.LoginUrl = $"{publicUrl}login";
					options.UserInteraction.ErrorUrl = $"{publicUrl}error";
					options.UserInteraction.LogoutUrl = $"{publicUrl}logout";
				})
				.AddInMemoryIdentityResources(IdentityContext.GetIdentityResources())
				.AddInMemoryApiScopes(IdentityContext.GetScopes())
				.AddInMemoryApiResources(IdentityContext.GetApis())
				.AddInMemoryClients(clients)
				.AddProfileService<AccountApi>()
				.AddSigninKeys(certificateOptions);

			services.AddAuthentication()
				.AddJwtBearer(options =>
				{
					options.Authority = publicUrl.ToString();
					options.Audience = "kyoo";
					options.RequireHttpsMetadata = false;
				});
		}

		/// <inheritdoc />
		public IEnumerable<IStartupAction> ConfigureSteps => new IStartupAction[]
		{
			SA.New<IApplicationBuilder>(app =>
			{
				PhysicalFileProvider provider = new(Path.Combine(
					Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location)!,
					"login"));
				app.UseDefaultFiles(new DefaultFilesOptions
				{
					RequestPath = new PathString("/login"),
					FileProvider = provider,
					RedirectToAppendTrailingSlash = true
				});
				app.UseStaticFiles(new StaticFileOptions
				{
					RequestPath = new PathString("/login"),
					FileProvider = provider
				});
			}, SA.StaticFiles),
			SA.New<IApplicationBuilder>(app =>
			{
				app.UseCookiePolicy(new CookiePolicyOptions
				{
					MinimumSameSitePolicy = SameSiteMode.Strict
				});
				app.UseAuthentication();
			}, SA.Authentication),
			SA.New<IApplicationBuilder>(app =>
			{
				app.Use((ctx, next) =>
				{
					ctx.SetIdentityServerOrigin(_configuration.GetPublicUrl().ToString());
					return next();
				});
				app.UseIdentityServer();
			}, SA.Endpoint),
			SA.New<IApplicationBuilder>(app => app.UseAuthorization(), SA.Authorization)
		};
	}
}
