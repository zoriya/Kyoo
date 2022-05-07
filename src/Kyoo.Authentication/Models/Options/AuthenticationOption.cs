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
	/// The main authentication options.
	/// </summary>
	public class AuthenticationOption
	{
		/// <summary>
		/// The path to get this option from the root configuration.
		/// </summary>
		public const string Path = "authentication";

		/// <summary>
		/// The default jwt secret.
		/// </summary>
		public const string DefaultSecret = "jwt-secret";

		/// <summary>
		/// The secret used to encrypt the jwt.
		/// </summary>
		public string Secret { get; set; } = DefaultSecret;

		/// <summary>
		/// Options for permissions
		/// </summary>
		public PermissionOption Permissions { get; set; } = new();

		/// <summary>
		/// Root path of user's profile pictures.
		/// </summary>
		public string ProfilePicturePath { get; set; } = "users/";
	}
}
