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
using Kyoo.Abstractions.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;

namespace Kyoo.Abstractions.Models.Permissions
{
	/// <summary>
	/// Specify one part of a permissions needed for the API (the kind or the type).
	/// </summary>
	[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
	public class PartialPermissionAttribute : Attribute, IFilterFactory
	{
		/// <summary>
		/// The needed permission type.
		/// </summary>
		public string? Type { get; }

		/// <summary>
		/// The needed permission kind.
		/// </summary>
		public Kind? Kind { get; }

		/// <summary>
		/// The group of this permission.
		/// </summary>
		public Group Group { get; set; }

		/// <summary>
		/// Ask a permission to run an action.
		/// </summary>
		/// <remarks>
		/// With this attribute, you can only specify a type or a kind.
		/// To have a valid permission attribute, you must specify the kind and the permission using two attributes.
		/// Those attributes can be dispatched at different places (one on the class, one on the method for example).
		/// If you don't put exactly two of those attributes, the permission attribute will be ill-formed and will
		/// lead to unspecified behaviors.
		/// </remarks>
		/// <param name="type">The type of the action</param>
		public PartialPermissionAttribute(string type)
		{
			Type = type.ToLower();
		}

		/// <summary>
		/// Ask a permission to run an action.
		/// </summary>
		/// <remarks>
		/// With this attribute, you can only specify a type or a kind.
		/// To have a valid permission attribute, you must specify the kind and the permission using two attributes.
		/// Those attributes can be dispatched at different places (one on the class, one on the method for example).
		/// If you don't put exactly two of those attributes, the permission attribute will be ill-formed and will
		/// lead to unspecified behaviors.
		/// </remarks>
		/// <param name="permission">The kind of permission needed.</param>
		public PartialPermissionAttribute(Kind permission)
		{
			Kind = permission;
		}

		/// <inheritdoc />
		public IFilterMetadata CreateInstance(IServiceProvider serviceProvider)
		{
			return serviceProvider.GetRequiredService<IPermissionValidator>().Create(this);
		}

		/// <inheritdoc />
		public bool IsReusable => true;
	}
}
