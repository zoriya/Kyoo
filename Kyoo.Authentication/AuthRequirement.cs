using Microsoft.AspNetCore.Authorization;

namespace Kyoo.Authentication
{
	public class AuthorizationValidator : IAuthorizationRequirement
	{
		public string Permission { get; }

		public AuthorizationValidator(string permission)
		{
			Permission = permission;
		}
	}
}