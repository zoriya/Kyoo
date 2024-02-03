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
	/// The kind of permission needed.
	/// </summary>
	public enum Kind
	{
		/// <summary>
		/// Allow the user to read for this kind of data.
		/// </summary>
		Read,

		/// <summary>
		/// Allow the user to write for this kind of data.
		/// </summary>
		Write,

		/// <summary>
		/// Allow the user to create this kind of data.
		/// </summary>
		Create,

		/// <summary>
		/// Allow the user to delete this kind od data.
		/// </summary>
		Delete
	}

	/// <summary>
	/// The group of the permission.
	/// </summary>
	public enum Group
	{
		/// <summary>
		/// Default group indicating no value.
		/// </summary>
		None,

		/// <summary>
		/// Allow all operations on basic items types.
		/// </summary>
		Overall,

		/// <summary>
		/// Allow operation on sensitive items like libraries path, configurations and so on.
		/// </summary>
		Admin
	}

	/// <summary>
	/// Specify permissions needed for the API.
	/// </summary>
	[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
	public class PermissionAttribute : Attribute, IFilterFactory
	{
		/// <summary>
		/// The needed permission as string.
		/// </summary>
		public string Type { get; }

		/// <summary>
		/// The needed permission kind.
		/// </summary>
		public Kind Kind { get; }

		/// <summary>
		/// The group of this permission.
		/// </summary>
		public Group Group { get; }

		/// <summary>
		/// Ask a permission to run an action.
		/// </summary>
		/// <param name="type">
		/// The type of the action
		/// </param>
		/// <param name="permission">
		/// The kind of permission needed.
		/// </param>
		/// <param name="group">
		/// The group of this permission (allow grouped permission like overall.read
		/// for all read permissions of this group).
		/// </param>
		public PermissionAttribute(string type, Kind permission, Group group = Group.Overall)
		{
			Type = type.ToLower();
			Kind = permission;
			Group = group;
		}

		/// <inheritdoc />
		public IFilterMetadata CreateInstance(IServiceProvider serviceProvider)
		{
			return serviceProvider.GetRequiredService<IPermissionValidator>().Create(this);
		}

		/// <inheritdoc />
		public bool IsReusable => true;

		/// <summary>
		/// Return this permission attribute as a string.
		/// </summary>
		/// <returns>The string representation.</returns>
		public string AsPermissionString()
		{
			return Type;
		}
	}
}
