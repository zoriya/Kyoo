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
using System.Security.Claims;
using Kyoo.Authentication.Models;

namespace Kyoo.Authentication
{
	/// <summary>
	/// Extension methods.
	/// </summary>
	public static class Extensions
	{
		/// <summary>
		/// Get the permissions of an user.
		/// </summary>
		/// <param name="user">The user</param>
		/// <returns>The list of permissions</returns>
		public static ICollection<string> GetPermissions(this ClaimsPrincipal user)
		{
			return user.Claims.FirstOrDefault(x => x.Type == Claims.Permissions)?.Value.Split(',')
				?? Array.Empty<string>();
		}

		/// <summary>
		/// Get the id of the current user or null if unlogged or invalid.
		/// </summary>
		/// <param name="user">The user.</param>
		/// <returns>The id of the user or null.</returns>
		public static Guid? GetId(this ClaimsPrincipal user)
		{
			Claim? value = user.FindFirst(Claims.Id);
			if (Guid.TryParse(value?.Value, out Guid id))
				return id;
			return null;
		}
	}
}
