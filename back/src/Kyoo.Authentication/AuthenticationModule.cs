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
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Autofac;
using Kyoo.Abstractions.Controllers;
using Kyoo.Authentication.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Primitives;
using Microsoft.IdentityModel.Tokens;

namespace Kyoo.Authentication
{
	/// <summary>
	/// A module that enable OpenID authentication for Kyoo.
	/// </summary>
	/// <remarks>
	/// Create a new authentication module instance and use the given configuration.
	/// </remarks>
	public class AuthenticationModule(
		IConfiguration configuration,
		ILogger<AuthenticationModule> logger
	) : IPlugin
	{
		/// <inheritdoc />
		public string Name => "Authentication";

		/// <summary>
		/// The configuration to use.
		/// </summary>
		private readonly IConfiguration _configuration = configuration;

		/// <inheritdoc />
		public void Configure(ContainerBuilder builder)
		{
			builder.RegisterType<PermissionValidator>().As<IPermissionValidator>().SingleInstance();
			builder.RegisterType<TokenController>().As<ITokenController>().SingleInstance();
		}

		/// <inheritdoc />
		public void Configure(IServiceCollection services)
		{
			string secret = _configuration.GetValue(
				"AUTHENTICATION_SECRET",
				AuthenticationOption.DefaultSecret
			)!;
			PermissionOption options =
				new()
				{
					Default = _configuration
						.GetValue("UNLOGGED_PERMISSIONS", "")!
						.Split(',')
						.Where(x => x.Length > 0)
						.ToArray(),
					NewUser = _configuration
						.GetValue("DEFAULT_PERMISSIONS", "overall.read,overall.play")!
						.Split(','),
					RequireVerification = _configuration.GetValue(
						"REQUIRE_ACCOUNT_VERIFICATION",
						true
					),
					PublicUrl =
						_configuration.GetValue<string?>("PUBLIC_URL") ?? "http://localhost:8901",
					ApiKeys = _configuration.GetValue("KYOO_APIKEYS", string.Empty)!.Split(','),
					OIDC = _configuration
						.AsEnumerable()
						.Where((pair) => pair.Key.StartsWith("OIDC_"))
						.Aggregate(
							new Dictionary<string, OidcProvider>(),
							(acc, val) =>
							{
								if (val.Value is null)
									return acc;
								if (val.Key.Split("_") is not ["OIDC", string provider, string key])
								{
									logger.LogError("Invalid oidc config value: {Key}", val.Key);
									return acc;
								}
								provider = provider.ToLowerInvariant();
								key = key.ToLowerInvariant();

								if (!acc.ContainsKey(provider))
									acc.Add(provider, new(provider));
								switch (key)
								{
									case "clientid":
										acc[provider].ClientId = val.Value;
										break;
									case "secret":
										acc[provider].Secret = val.Value;
										break;
									case "scope":
										acc[provider].Scope = val.Value;
										break;
									case "authorization":
										acc[provider].AuthorizationUrl = val.Value;
										break;
									case "token":
										acc[provider].TokenUrl = val.Value;
										break;
									case "userinfo":
									case "profile":
										acc[provider].ProfileUrl = val.Value;
										break;
									case "name":
										acc[provider].DisplayName = val.Value;
										break;
									case "logo":
										acc[provider].LogoUrl = val.Value;
										break;
									default:
										logger.LogError("Invalid oidc config value: {Key}", key);
										return acc;
								}
								return acc;
							}
						),
				};
			services.AddSingleton(options);
			services.AddSingleton(
				new AuthenticationOption() { Secret = secret, Permissions = options, }
			);

			services
				.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
				.AddJwtBearer(options =>
				{
					options.Events = new()
					{
						OnMessageReceived = (ctx) =>
						{
							string prefix = "Bearer ";
							if (
								ctx.Request.Headers.TryGetValue(
									"Authorization",
									out StringValues val
								)
								&& val.ToString() is string auth
								&& auth.StartsWith(prefix)
							)
							{
								ctx.Token ??= auth[prefix.Length..];
							}
							ctx.Token ??= ctx.Request.Cookies["X-Bearer"];
							return Task.CompletedTask;
						}
					};
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
		public IEnumerable<IStartupAction> ConfigureSteps =>
			new IStartupAction[]
			{
				SA.New<IApplicationBuilder>(app => app.UseAuthentication(), SA.Authentication),
			};
	}
}
