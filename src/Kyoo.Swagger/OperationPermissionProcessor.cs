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
using System.Reflection;
using Kyoo.Abstractions.Models.Permissions;
using NSwag;
using NSwag.Generation.Processors;
using NSwag.Generation.Processors.Contexts;

namespace Kyoo.Swagger
{
	/// <summary>
	/// An operation processor that adds permissions information from the <see cref="PermissionAttribute"/> and the
	/// <see cref="PartialPermissionAttribute"/>.
	/// </summary>
	public class OperationPermissionProcessor : IOperationProcessor
	{
		/// <inheritdoc />
		public bool Process(OperationProcessorContext context)
		{
			context.OperationDescription.Operation.Security ??= new List<OpenApiSecurityRequirement>();
			OpenApiSecurityRequirement perms = context.MethodInfo.GetCustomAttributes<UserOnlyAttribute>()
				.Aggregate(new OpenApiSecurityRequirement(), (agg, cur) =>
				{
					agg[nameof(Kyoo)] = Array.Empty<string>();
					return agg;
				});

			perms = context.MethodInfo.GetCustomAttributes<PermissionAttribute>()
				.Aggregate(perms, (agg, cur) =>
				{
					ICollection<string> permissions = _GetPermissionsList(agg, cur.Group);
					permissions.Add($"{cur.Type}.{cur.Kind.ToString().ToLower()}");
					agg[nameof(Kyoo)] = permissions;
					return agg;
				});

			PartialPermissionAttribute controller = context.ControllerType
				.GetCustomAttribute<PartialPermissionAttribute>();
			if (controller != null)
			{
				perms = context.MethodInfo.GetCustomAttributes<PartialPermissionAttribute>()
					.Aggregate(perms, (agg, cur) =>
					{
						Group group = controller.Group != Group.Overall
							? controller.Group
							: cur.Group;
						string type = controller.Type ?? cur.Type;
						Kind kind = controller.Type == null
							? controller.Kind
							: cur.Kind;
						ICollection<string> permissions = _GetPermissionsList(agg, group);
						permissions.Add($"{type}.{kind.ToString().ToLower()}");
						agg[nameof(Kyoo)] = permissions;
						return agg;
					});
			}

			context.OperationDescription.Operation.Security.Add(perms);
			return true;
		}

		private static ICollection<string> _GetPermissionsList(OpenApiSecurityRequirement security, Group group)
		{
			return security.TryGetValue(group.ToString(), out IEnumerable<string> perms)
				? perms.ToList()
				: new List<string>();
		}
	}
}
