using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using IdentityServer4.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;

namespace Kyoo.Controllers
{
	public class AuthorizationValidatorHandler : AuthorizationHandler<AuthorizationValidator>
	{
		private readonly IConfiguration _configuration;
		
		public AuthorizationValidatorHandler(IConfiguration configuration)
		{
			_configuration = configuration;
		}
		
		protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, AuthorizationValidator requirement)
		{
			if (!context.User.IsAuthenticated())
			{
				string defaultPerms = _configuration.GetValue<string>("defaultPermissions");
				if (defaultPerms.Split(',').Contains(requirement.Permission.ToLower()))
					context.Succeed(requirement);
			}
			else
			{
				Claim perms = context.User.Claims.FirstOrDefault(x => x.Type == "permissions");
				if (perms != null && perms.Value.Split(",").Contains(requirement.Permission.ToLower()))
					context.Succeed(requirement);
			}

			return Task.CompletedTask;
		}
	}

	public class AuthorizationValidator : IAuthorizationRequirement
	{
		public string Permission;

		public AuthorizationValidator(string permission)
		{
			Permission = permission;
		}
	}
}