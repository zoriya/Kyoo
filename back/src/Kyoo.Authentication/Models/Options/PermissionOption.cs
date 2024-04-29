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
using Kyoo.Abstractions.Models.Permissions;
using Kyoo.Authentication.Models.DTO;

namespace Kyoo.Authentication.Models;

/// <summary>
/// Permission options.
/// </summary>
public class PermissionOption
{
	/// <summary>
	/// The path to get this option from the root configuration.
	/// </summary>
	public const string Path = "authentication:permissions";

	/// <summary>
	/// True if new users needs to be verifed.
	/// </summary>
	public bool RequireVerification { get; set; }

	/// <summary>
	/// The default permissions that will be given to a non-connected user.
	/// </summary>
	public string[] Default { get; set; } = { "overall.read", "overall.play" };

	/// <summary>
	/// Permissions applied to a new user.
	/// </summary>
	public string[] NewUser { get; set; } = { "overall.read", "overall.play" };

	public static string[] Admin =>
		Enum.GetNames<Group>()
			.Where(x => x != nameof(Group.None))
			.SelectMany(group =>
				Enum.GetNames<Kind>().Select(kind => $"{group}.{kind}".ToLowerInvariant())
			)
			.ToArray();

	/// <summary>
	/// The list of available ApiKeys.
	/// </summary>
	public string[] ApiKeys { get; set; } = Array.Empty<string>();

	public string PublicUrl { get; set; }

	public Dictionary<string, OidcProvider> OIDC { get; set; }
}

public enum AuthMethod
{
	ClientSecretBasic,
	ClientSecretPost,
	None,
}

public class OidcProvider
{
	public string DisplayName { get; set; }
	public string? LogoUrl { get; set; }
	public string AuthorizationUrl { get; set; }
	public string TokenUrl { get; set; }

	/// <summary>
	/// Some token endpoints do net respect the spec and require a json body instead of a form url encoded.
	/// </summary>
	public bool TokenUseJsonBody { get; set; }

	/// <summary>
	/// The OIDC spec allows multiples ways of authorizing the client.
	/// </summary>
	public AuthMethod ClientAuthMethod { get; set; } = AuthMethod.ClientSecretBasic;

	public string ProfileUrl { get; set; }
	public string? Scope { get; set; }
	public string ClientId { get; set; }
	public string Secret { get; set; }

	public Func<JwtProfile, string?>? GetProfileUrl { get; init; }
	public Func<OidcProvider, Dictionary<string, string>>? GetExtraHeaders { get; init; }

	public bool Enabled =>
		AuthorizationUrl != null
		&& TokenUrl != null
		&& ProfileUrl != null
		&& ClientId != null
		&& Secret != null;

	public OidcProvider(string provider)
	{
		DisplayName = provider;
		if (KnownProviders?.ContainsKey(provider) == true)
		{
			DisplayName = KnownProviders[provider].DisplayName;
			LogoUrl = KnownProviders[provider].LogoUrl;
			AuthorizationUrl = KnownProviders[provider].AuthorizationUrl;
			TokenUrl = KnownProviders[provider].TokenUrl;
			ProfileUrl = KnownProviders[provider].ProfileUrl;
			Scope = KnownProviders[provider].Scope;
			ClientId = KnownProviders[provider].ClientId;
			Secret = KnownProviders[provider].Secret;
			TokenUseJsonBody = KnownProviders[provider].TokenUseJsonBody;
			ClientAuthMethod = KnownProviders[provider].ClientAuthMethod;
			GetProfileUrl = KnownProviders[provider].GetProfileUrl;
			GetExtraHeaders = KnownProviders[provider].GetExtraHeaders;
		}
	}

	public static readonly Dictionary<string, OidcProvider> KnownProviders =
		new()
		{
			["google"] = new("google")
			{
				DisplayName = "Google",
				LogoUrl = "https://logo.clearbit.com/google.com",
				AuthorizationUrl = "https://accounts.google.com/o/oauth2/v2/auth",
				TokenUrl = "https://oauth2.googleapis.com/token",
				ProfileUrl = "https://openidconnect.googleapis.com/v1/userinfo",
				Scope = "email profile",
			},
			["discord"] = new("discord")
			{
				DisplayName = "Discord",
				LogoUrl = "https://logo.clearbit.com/discord.com",
				AuthorizationUrl = "https://discord.com/oauth2/authorize",
				TokenUrl = "https://discord.com/api/oauth2/token",
				ProfileUrl = "https://discord.com/api/users/@me",
				Scope = "email+identify",
			},
			["simkl"] = new("simkl")
			{
				DisplayName = "Simkl",
				LogoUrl = "https://logo.clearbit.com/simkl.com",
				AuthorizationUrl = "https://simkl.com/oauth/authorize",
				TokenUrl = "https://api.simkl.com/oauth/token",
				ProfileUrl = "https://api.simkl.com/users/settings",
				// does not seems to have scopes
				Scope = null,
				TokenUseJsonBody = true,
				ClientAuthMethod = AuthMethod.ClientSecretPost,
				GetProfileUrl = (profile) => $"https://simkl.com/{profile.Sub}/dashboard/",
				GetExtraHeaders = (OidcProvider self) =>
					new() { ["simkl-api-key"] = self.ClientId },
			},
			["trakt"] = new("trakt")
			{
				DisplayName = "Trakt",
				LogoUrl = "https://logo.clearbit.com/trakt.tv",
				AuthorizationUrl = "https://api.trakt.tv/oauth/authorize",
				TokenUrl = "https://api.trakt.tv/oauth/token",
				ProfileUrl = "https://api.trakt.tv/users/settings",
				// does not seems to have scopes
				Scope = null,
				TokenUseJsonBody = true,
				GetProfileUrl = (profile) => $"https://trakt.tv/users/{profile.Username}",
				GetExtraHeaders = (OidcProvider self) =>
					new() { ["trakt-api-key"] = self.ClientId, ["trakt-api-version"] = "2", },
			},
		};
}
