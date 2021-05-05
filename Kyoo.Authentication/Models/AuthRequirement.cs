using Microsoft.AspNetCore.Authorization;

namespace Kyoo.Authentication
{
	/// <summary>
	/// The requirement of Kyoo's authentication policies.
	/// </summary>
	public class AuthRequirement : IAuthorizationRequirement
	{
		/// <summary>
		/// The name of the permission
		/// </summary>
		public string Permission { get; }

		/// <summary>
		/// Create a new <see cref="AuthRequirement"/> for the given permission.
		/// </summary>
		/// <param name="permission">The permission needed</param>
		public AuthRequirement(string permission)
		{
			Permission = permission;
		}
	}
}