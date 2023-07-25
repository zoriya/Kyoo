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

using System.Collections.Generic;
using System.Text;
using Autofac;
using Kyoo.Abstractions.Controllers;
using Kyoo.Authentication.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace Kyoo.Authentication
{
	/// <summary>
	/// A module that enable OpenID authentication for Kyoo.
	/// </summary>
	public class AuthenticationModule : IPlugin
	{
		/// <inheritdoc />
		public string Name => "Authentication";

		/// <summary>
		/// The configuration to use.
		/// </summary>
		private readonly IConfiguration _configuration;

		/// <summary>
		/// Create a new authentication module instance and use the given configuration.
		/// </summary>
		/// <param name="configuration">The configuration to use</param>
		public AuthenticationModule(IConfiguration configuration)
		{
			_configuration = configuration;
		}

		/// <inheritdoc />
		public void Configure(ContainerBuilder builder)
		{
			builder.RegisterType<PermissionValidator>().As<IPermissionValidator>().SingleInstance();
			builder.RegisterType<TokenController>().As<ITokenController>().SingleInstance();
		}

		/// <inheritdoc />
		public void Configure(IServiceCollection services)
		{
			string secret = _configuration.GetValue("AUTHENTICATION_SECRET", AuthenticationOption.DefaultSecret)!;
			PermissionOption permissions = new()
			{
				Default = _configuration.GetValue("UNLOGGED_PERMISSIONS", "overall.read")!.Split(','),
				NewUser = _configuration.GetValue("DEFAULT_PERMISSIONS", "overall.read")!.Split(','),
				ApiKeys = _configuration.GetValue("KYOO_APIKEYS", string.Empty)!.Split(','),
			};
			services.AddSingleton(permissions);
			services.AddSingleton(new AuthenticationOption()
			{
				Secret = secret,
				Permissions = permissions,
			});

			// TODO handle direct-videos with bearers (probably add a cookie and a app.Use to translate that for videos)
			services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
				.AddJwtBearer(options =>
				{
					options.TokenValidationParameters = new TokenValidationParameters
					{
						ValidateIssuer = false,
						ValidateAudience = false,
						ValidateLifetime = true,
						ValidateIssuerSigningKey = true,
						IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret))
					};
				});
		}

		/// <inheritdoc />
		public IEnumerable<IStartupAction> ConfigureSteps => new IStartupAction[]
		{
			SA.New<IApplicationBuilder>(app => app.UseAuthentication(), SA.Authentication),
		};
	}
}
