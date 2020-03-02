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
							Name = "kyoo.admin",
							DisplayName = "Full access to the admin's API and the public API."
						}
					}
				}
			};
		}
	}
}