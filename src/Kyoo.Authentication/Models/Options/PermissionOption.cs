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
		/// The default permissions that will be given to a non-connected user.
		/// </summary>
		public string[] Default { get; set; }

		/// <summary>
		/// Permissions applied to a new user.
		/// </summary>
		public string[] NewUser { get; set; }
	}
}
