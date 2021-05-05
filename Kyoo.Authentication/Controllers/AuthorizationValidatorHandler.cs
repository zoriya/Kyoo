using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using IdentityServer4.Extensions;
using Kyoo.Authentication.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace Kyoo.Authentication
{
	/// <summary>
	/// The default IAuthorizationHandler implementation.
	/// </summary>
	public class AuthorizationValidatorHandler : AuthorizationHandler<AuthRequirement>
	{
		/// <summary>
		/// The permissions options to retrieve default permissions.
		/// </summary>
		private readonly IOptionsMonitor<PermissionOption> _options;
		
		/// <summary>
		/// Create a new <see cref="AuthorizationValidatorHandler"/>.
		/// </summary>
		/// <param name="options">The option containing default values.</param>
		public AuthorizationValidatorHandler(IOptionsMonitor<PermissionOption> options)
		{
			_options = options;
		}


		/// <inheritdoc />
		protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, AuthRequirement requirement)
		{
			if (context.User.IsAuthenticated())
			{
				Claim perms = context.User.Claims.FirstOrDefault(x => x.Type == "permissions");
				if (perms != null && perms.Value.Split(",").Contains(requirement.Permission.ToLower()))
					context.Succeed(requirement);
			}
			else
			{
				ICollection<string> defaultPerms = _options.CurrentValue.Default;
				if (defaultPerms.Contains(requirement.Permission.ToLower()))
					context.Succeed(requirement);
			}

			return Task.CompletedTask;
		}
	}
}