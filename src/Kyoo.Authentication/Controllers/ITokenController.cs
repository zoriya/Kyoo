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
using System.Threading.Tasks;
using JetBrains.Annotations;
using Kyoo.Abstractions.Models;
using Microsoft.IdentityModel.Tokens;

namespace Kyoo.Authentication
{
	/// <summary>
	/// The service that controls jwt creation and validation.
	/// </summary>
	public interface ITokenController
	{
		/// <summary>
		/// Create a new access token for the given user.
		/// </summary>
		/// <param name="user">The user to create a token for.</param>
		/// <param name="expireIn">When this token will expire.</param>
		/// <returns>A new, valid access token.</returns>
		string CreateAccessToken([NotNull] User user, out TimeSpan expireIn);

		/// <summary>
		/// Create a new refresh token for the given user.
		/// </summary>
		/// <param name="user">The user to create a token for.</param>
		/// <returns>A new, valid refresh token.</returns>
		Task<string> CreateRefreshToken([NotNull] User user);

		/// <summary>
		/// Check if the given refresh token is valid and if it is, retrieve the id of the user this token belongs to.
		/// </summary>
		/// <param name="refreshToken">The refresh token to validate.</param>
		/// <exception cref="SecurityTokenException">The given refresh token is not valid.</exception>
		/// <returns>The id of the token's user.</returns>
		int GetRefreshTokenUserID(string refreshToken);
	}
}
