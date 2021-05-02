using System.Collections.Generic;
using System.Linq;
using IdentityServer4.Models;

namespace Kyoo.Authentication
{
	public static class IdentityContext
	{
		public static IEnumerable<IdentityResource> GetIdentityResources()
		{
			return new List<IdentityResource>
			{
				new IdentityResources.OpenId(),
				new IdentityResources.Email(),
				new IdentityResources.Profile()
			};
		}

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
					
					AllowedScopes = { "openid", "profile", "kyoo.read", "kyoo.write", "kyoo.play", "kyoo.download", "kyoo.admin" },
					RedirectUris =  { "/", "/silent.html" },
					PostLogoutRedirectUris = { "/logout" }
				}
			};
		}

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
					Name = "kyoo.download",
					DisplayName = "Allow downloading of episodes and movies from kyoo."
				},
				new ApiScope
				{
					Name = "kyoo.admin",
					DisplayName = "Full access to the admin's API and the public API."
				}
			};
		}
		
		public static IEnumerable<ApiResource> GetApis()
		{
			return new[]
			{
				new ApiResource
				{
					Name = "Kyoo",
					Scopes = GetScopes().Select(x => x.Name).ToArray()
				}
			};
		}
	}
}