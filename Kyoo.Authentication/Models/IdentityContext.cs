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
using System.Linq;
using IdentityServer4.Models;

namespace Kyoo.Authentication
{
	/// <summary>
	/// The hard coded context of the identity server.
	/// </summary>
	public static class IdentityContext
	{
		/// <summary>
		/// The list of identity resources supported (email, profile and openid)
		/// </summary>
		/// <returns>The list of identity resources supported</returns>
		public static IEnumerable<IdentityResource> GetIdentityResources()
		{
			return new List<IdentityResource>
			{
				new IdentityResources.OpenId(),
				new IdentityResources.Email(),
				new IdentityResources.Profile()
			};
		}

		/// <summary>
		/// Get the list of officially supported clients.
		/// </summary>
		/// <remarks>
		/// You can add custom clients in the settings.json file.
		/// </remarks>
		/// <returns>The list of officially supported clients.</returns>
		public static IEnumerable<Client> GetClients()
		{
			return new List<Client>
			{
				new()
				{
					ClientId = "kyoo.webapp",

					AccessTokenType = AccessTokenType.Jwt,
					AllowedGrantTypes = GrantTypes.Code,
					RequirePkce = true,
					RequireClientSecret = false,

					AllowAccessTokensViaBrowser = true,
					AllowOfflineAccess = true,
					RequireConsent = false,

					AllowedScopes = { "openid", "profile", "kyoo.read", "kyoo.write", "kyoo.play", "kyoo.admin" },
					RedirectUris = { "/", "/silent.html" },
					PostLogoutRedirectUris = { "/logout" }
				}
			};
		}

		/// <summary>
		/// The list of scopes supported by the API.
		/// </summary>
		/// <returns>The list of scopes</returns>
		public static IEnumerable<ApiScope> GetScopes()
		{
			return new[]
			{
				new ApiScope
				{
					Name = "kyoo.read",
					DisplayName = "Read only access to the API.",
				},
				new ApiScope
				{
					Name = "kyoo.write",
					DisplayName = "Read and write access to the public API"
				},
				new ApiScope
				{
					Name = "kyoo.play",
					DisplayName = "Allow playback of movies and episodes."
				},
				new ApiScope
				{
					Name = "kyoo.admin",
					DisplayName = "Full access to the admin's API and the public API."
				}
			};
		}

		/// <summary>
		/// The list of APIs (this is used to create Audiences)
		/// </summary>
		/// <returns>The list of apis</returns>
		public static IEnumerable<ApiResource> GetApis()
		{
			return new[]
			{
				new ApiResource("kyoo", "Kyoo")
				{
					Scopes = GetScopes().Select(x => x.Name).ToArray()
				}
			};
		}
	}
}
