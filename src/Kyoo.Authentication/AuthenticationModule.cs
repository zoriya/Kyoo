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
using System.IO;
using System.Reflection;
using System.Text;
using Autofac;
using Kyoo.Abstractions;
using Kyoo.Abstractions.Controllers;
using Kyoo.Authentication.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
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
		public string Description => "Enable an authentication/permission system for Kyoo (via Jwt or ApKeys).";

		/// <inheritdoc />
		public Dictionary<string, Type> Configuration => new()
		{
			{ AuthenticationOption.Path, typeof(AuthenticationOption) },
			{ PermissionOption.Path, typeof(PermissionOption) },
		};

		/// <summary>
		/// The configuration to use.
		/// </summary>
		private readonly IConfiguration _configuration;

		/// <summary>
		/// The environment information to check if the app runs in debug mode
		/// </summary>
		private readonly IWebHostEnvironment _environment;

		/// <summary>
		/// Create a new authentication module instance and use the given configuration and environment.
		/// </summary>
		/// <param name="configuration">The configuration to use</param>
		/// <param name="environment">The environment information to check if the app runs in debug mode</param>
		public AuthenticationModule(IConfiguration configuration,
			IWebHostEnvironment environment)
		{
			_configuration = configuration;
			_environment = environment;
		}

		/// <inheritdoc />
		public void Configure(ContainerBuilder builder)
		{
			builder.RegisterType<PermissionValidator>().As<IPermissionValidator>().SingleInstance();
		}

		/// <inheritdoc />
		public void Configure(IServiceCollection services)
		{
			Uri publicUrl = _configuration.GetPublicUrl();
			AuthenticationOption jwt = new();
			_configuration.GetSection(AuthenticationOption.Path).Bind(jwt);

			// TODO handle direct-videos with bearers (probably add a cookie and a app.Use to translate that for videos)
			services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
				.AddJwtBearer(options =>
				{
					options.TokenValidationParameters = new TokenValidationParameters
					{
						ValidateIssuer = true,
						ValidateAudience = true,
						ValidateLifetime = true,
						ValidateIssuerSigningKey = true,
						ValidIssuer = publicUrl.ToString(),
						ValidAudience = publicUrl.ToString(),
						IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Secret))
					};
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
