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

using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using IdentityModel;
using IdentityServer4;
using Kyoo.Abstractions.Models;

namespace Kyoo.Authentication
{
	/// <summary>
	/// Extension methods.
	/// </summary>
	public static class Extensions
	{
		/// <summary>
		/// Get claims of an user.
		/// </summary>
		/// <param name="user">The user concerned</param>
		/// <returns>The list of claims the user has</returns>
		public static ICollection<Claim> GetClaims(this User user)
		{
			return new[]
			{
				new Claim(JwtClaimTypes.Subject, user.ID.ToString()),
				new Claim(JwtClaimTypes.Name, user.Username),
				new Claim(JwtClaimTypes.Picture, $"api/account/picture/{user.Slug}")
			};
		}

		/// <summary>
		/// Convert a user to an IdentityServerUser.
		/// </summary>
		/// <param name="user">The user to convert.</param>
		/// <returns>The corresponding identity server user.</returns>
		public static IdentityServerUser ToIdentityUser(this User user)
		{
			return new IdentityServerUser(user.ID.ToString())
			{
				DisplayName = user.Username,
				AdditionalClaims = new[] { new Claim("permissions", string.Join(',', user.Permissions)) }
			};
		}

		/// <summary>
		/// Get the permissions of an user.
		/// </summary>
		/// <param name="user">The user</param>
		/// <returns>The list of permissions</returns>
		public static ICollection<string> GetPermissions(this ClaimsPrincipal user)
		{
			return user.Claims.FirstOrDefault(x => x.Type == "permissions")?.Value.Split(',');
		}
	}
}
