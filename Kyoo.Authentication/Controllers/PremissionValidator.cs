using System;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Authentication.Models;
using Kyoo.Models.Permissions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;

namespace Kyoo.Authentication
{
	/// <summary>
	/// A permission validator to validate permission with user Permission array
	/// or the default array from the configurations if the user is not logged. 
	/// </summary>
	public class PermissionValidatorFactory : IPermissionValidator
	{
		/// <summary>
		/// The permissions options to retrieve default permissions.
		/// </summary>
		private readonly IOptionsMonitor<PermissionOption> _options;

		/// <summary>
		/// Create a new factory with the given options
		/// </summary>
		/// <param name="options">The option containing default values.</param>
		public PermissionValidatorFactory(IOptionsMonitor<PermissionOption> options)
		{
			_options = options;
		}

		/// <inheritdoc />
		public IFilterMetadata Create(PermissionAttribute attribute)
		{
			return new PermissionValidator(attribute.AsPermissionString(), _options);
		}
		
		/// <inheritdoc />
		public IFilterMetadata Create(PartialPermissionAttribute attribute)
		{
			return new PermissionValidator((object)attribute.Type ?? attribute.Kind, _options);
		}

		/// <summary>
		/// The authorization filter used by <see cref="PermissionValidatorFactory"/>
		/// </summary>
		private class PermissionValidator : IAsyncAuthorizationFilter
		{
			/// <summary>
			/// The permission to validate
			/// </summary>
			private readonly string _permission;
			/// <summary>
			/// Information about partial items.
			/// </summary>
			private readonly object _partialInfo;
			/// <summary>
			/// The permissions options to retrieve default permissions.
			/// </summary>
			private readonly IOptionsMonitor<PermissionOption> _options;

			/// <summary>
			/// Create a new permission validator with the given options
			/// </summary>
			/// <param name="permission">The permission to validate</param>
			/// <param name="options">The option containing default values.</param>
			public PermissionValidator(string permission, IOptionsMonitor<PermissionOption> options)
			{
				_permission = permission;
				_options = options;
			}

			/// <summary>
			/// Create a new permission validator with the given options
			/// </summary>
			/// <param name="partialInfo">The partial permission to validate</param>
			/// <param name="options">The option containing default values.</param>
			public PermissionValidator(object partialInfo, IOptionsMonitor<PermissionOption> options)
			{
				_partialInfo = partialInfo;
				_options = options;
			}


			/// <inheritdoc />
			public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
			{
				string permission = _permission;

				if (_partialInfo != null)
				{
					switch (context.HttpContext.Items["PermissionType"])
					{
						case string perm when _partialInfo is Kind kind:
							 permission = $"{perm}.{kind.ToString().ToLower()}";
							break;
						case Kind kind when _partialInfo is string partial:
							permission = $"{partial}.{kind.ToString().ToLower()}";
							break;
						case null:
							context.HttpContext.Items["PermissionType"] = _partialInfo;
							return;
						default:
							throw new ArgumentException("Multiple non-matching partial permission attribute " +
							                            "are not supported.");
					}
				}

				AuthenticateResult res = await context.HttpContext.AuthenticateAsync(JwtBearerDefaults.AuthenticationScheme);
				if (res.Succeeded)
				{
					if (res.Principal.GetPermissions().All(x => x != permission))
						context.Result = new StatusCodeResult(StatusCodes.Status403Forbidden);
				}
				else
				{
					if (res.Failure != null || _options.CurrentValue.Default.All(x => x != permission))
						context.Result = new StatusCodeResult(StatusCodes.Status401Unauthorized);
				}
			}
		}
	}
}