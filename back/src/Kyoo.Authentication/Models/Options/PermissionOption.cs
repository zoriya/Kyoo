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
using System.Linq;
using Kyoo.Abstractions.Models.Permissions;

namespace Kyoo.Authentication.Models
{
	/// <summary>
	/// Permission options.
	/// </summary>
	public class PermissionOption
	{
		/// <summary>
		/// The path to get this option from the root configuration.
		/// </summary>
		public const string Path = "authentication:permissions";

		/// <summary>
		/// All permissions possibles, this is used to create an admin group.
		/// </summary>
		public static string[] Admin
		{
			get
			{
				return Enum.GetNames<Group>()
					.SelectMany(
						group =>
							Enum.GetNames<Kind>()
								.Select(kind => $"{group}.{kind}".ToLowerInvariant())
					)
					.ToArray();
			}
		}

		/// <summary>
		/// The default permissions that will be given to a non-connected user.
		/// </summary>
		public string[] Default { get; set; } = { "overall.read" };

		/// <summary>
		/// Permissions applied to a new user.
		/// </summary>
		public string[] NewUser { get; set; } = { "overall.read" };

		/// <summary>
		/// The list of available ApiKeys.
		/// </summary>
		public string[] ApiKeys { get; set; } = Array.Empty<string>();
	}
}
