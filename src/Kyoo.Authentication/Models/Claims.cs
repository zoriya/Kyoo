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
	/// List of well known claims of kyoo
	/// </summary>
	public static class Claims
	{
		/// <summary>
		/// The id of the user
		/// </summary>
		public static string Id => "id";

		/// <summary>
		/// The name of the user
		/// </summary>
		public static string Name => "name";

		/// <summary>
		/// The email of the user.
		/// </summary>
		public static string Email => "email";

		/// <summary>
		/// The list of permissions that the user has.
		/// </summary>
		public static string Permissions => "permissions";

		/// <summary>
		/// The type of the token (either "access" or "refresh").
		/// </summary>
		public static string Type => "type";

		/// <summary>
		/// A guid used to identify a specific refresh token. This is only useful for the server to revokate tokens.
		/// </summary>
		public static string Guid => "guid";
	}
}
