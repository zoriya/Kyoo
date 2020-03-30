using System.Collections.Generic;
using IdentityServer4.Models;

namespace Kyoo
{
	public class IdentityContext
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
				new Client
				{
					ClientId = "kyoo.webapp",
					AllowedGrantTypes = GrantTypes.Code,
					RequirePkce = true,
					AllowAccessTokensViaBrowser = true,
					AlwaysIncludeUserClaimsInIdToken = true,
					AllowOfflineAccess = true,
					RequireClientSecret = false,
					RequireConsent = false,
					AccessTokenType = AccessTokenType.Jwt,
					AllowedScopes = { "openid", "profile", "kyoo.read", "kyoo.write", "kyoo.play", "kyoo.download", "kyoo.admin" },
					RedirectUris =  { "/", "/silent" },
					PostLogoutRedirectUris = { "/logout" }
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
					Scopes =
					{
						new Scope
						{
							Name = "kyoo.read",
							DisplayName = "Read only access to the API.",
						},
						new Scope
						{
							Name = "kyoo.write",
							DisplayName = "Read and write access to the public API"
						},
						new Scope
						{
							Name = "kyoo.play",
							DisplayName = "Allow playback of movies and episodes."
						},
						new Scope
						{
							Name = "kyoo.download",
							DisplayName = "Allow downloading of episodes and movies from kyoo."
						},
						new Scope
						{
							Name = "kyoo.admin",
							DisplayName = "Full access to the admin's API and the public API."
						}
					}
				}
			};
		}
	}
}