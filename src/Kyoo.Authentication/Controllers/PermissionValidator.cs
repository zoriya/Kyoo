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
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models.Permissions;
using Kyoo.Authentication.Models;
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
	public class PermissionValidator : IPermissionValidator
	{
		/// <summary>
		/// The permissions options to retrieve default permissions.
		/// </summary>
		private readonly IOptionsMonitor<PermissionOption> _options;

		/// <summary>
		/// Create a new factory with the given options.
		/// </summary>
		/// <param name="options">The option containing default values.</param>
		public PermissionValidator(IOptionsMonitor<PermissionOption> options)
		{
			_options = options;
		}

		/// <inheritdoc />
		public IFilterMetadata Create(PermissionAttribute attribute)
		{
			return new PermissionValidatorFilter(attribute.Type, attribute.Kind, attribute.Group, _options);
		}

		/// <inheritdoc />
		public IFilterMetadata Create(PartialPermissionAttribute attribute)
		{
			return new PermissionValidatorFilter((object)attribute.Type ?? attribute.Kind, attribute.Group, _options);
		}

		/// <summary>
		/// The authorization filter used by <see cref="PermissionValidator"/>.
		/// </summary>
		private class PermissionValidatorFilter : IAsyncAuthorizationFilter
		{
			/// <summary>
			/// The permission to validate.
			/// </summary>
			private readonly string _permission;

			/// <summary>
			/// The kind of permission needed.
			/// </summary>
			private readonly Kind? _kind;

			/// <summary>
			/// The group of he permission.
			/// </summary>
			private readonly Group _group = Group.Overall;

			/// <summary>
			/// The permissions options to retrieve default permissions.
			/// </summary>
			private readonly IOptionsMonitor<PermissionOption> _options;

			/// <summary>
			/// Create a new permission validator with the given options.
			/// </summary>
			/// <param name="permission">The permission to validate.</param>
			/// <param name="kind">The kind of permission needed.</param>
			/// <param name="group">The group of the permission.</param>
			/// <param name="options">The option containing default values.</param>
			public PermissionValidatorFilter(string permission, Kind kind, Group group,
				IOptionsMonitor<PermissionOption> options)
			{
				_permission = permission;
				_kind = kind;
				_group = group;
				_options = options;
			}

			/// <summary>
			/// Create a new permission validator with the given options.
			/// </summary>
			/// <param name="partialInfo">The partial permission to validate.</param>
			/// <param name="group">The group of the permission.</param>
			/// <param name="options">The option containing default values.</param>
			public PermissionValidatorFilter(object partialInfo, Group? group, IOptionsMonitor<PermissionOption> options)
			{
				switch (partialInfo)
				{
					case Kind kind:
						_kind = kind;
						break;
					case string perm:
						_permission = perm;
						break;
					default:
						throw new ArgumentException($"{nameof(partialInfo)} can only be a permission string or a kind.");
				}

				if (group != null)
					_group = group.Value;
				_options = options;
			}

			/// <inheritdoc />
			public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
			{
				string permission = _permission;
				Kind? kind = _kind;

				if (permission == null || kind == null)
				{
					switch (context.HttpContext.Items["PermissionType"])
					{
						case string perm:
							permission = perm;
							break;
						case Kind kin:
							kind = kin;
							break;
						case null when kind != null:
							context.HttpContext.Items["PermissionType"] = kind;
							return;
						case null when permission != null:
							context.HttpContext.Items["PermissionType"] = permission;
							return;
						default:
							throw new ArgumentException("Multiple non-matching partial permission attribute " +
								"are not supported.");
					}
					if (permission == null || kind == null)
					{
						throw new ArgumentException("The permission type or kind is still missing after two partial " +
							"permission attributes, this is unsupported.");
					}
				}

				string permStr = $"{permission.ToLower()}.{kind.ToString()!.ToLower()}";
				string overallStr = $"{_group.ToString().ToLower()}.{kind.ToString()!.ToLower()}";
				AuthenticateResult res = await context.HttpContext.AuthenticateAsync(JwtBearerDefaults.AuthenticationScheme);
				if (res.Succeeded)
				{
					ICollection<string> permissions = res.Principal.GetPermissions();
					if (permissions.All(x => x != permStr && x != overallStr))
						context.Result = new StatusCodeResult(StatusCodes.Status403Forbidden);
				}
				else
				{
					ICollection<string> permissions = _options.CurrentValue.Default ?? Array.Empty<string>();
					if (res.Failure != null || permissions.All(x => x != permStr && x != overallStr))
						context.Result = new StatusCodeResult(StatusCodes.Status401Unauthorized);
				}
			}
		}
	}
}
