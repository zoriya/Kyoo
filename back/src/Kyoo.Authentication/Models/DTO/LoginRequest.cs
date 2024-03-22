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

namespace Kyoo.Authentication.Models.DTO;

/// <summary>
/// A model only used on login requests.
/// </summary>
public class LoginRequest
{
	/// <summary>
	/// The user's username.
	/// </summary>
	public string Username { get; set; }

	/// <summary>
	/// The user's password.
	/// </summary>
	public string Password { get; set; }

	/// <summary>
	/// Initializes a new instance of the <see cref="LoginRequest"/> class.
	/// </summary>
	/// <param name="username">The user's username.</param>
	/// <param name="password">The user's password.</param>
	public LoginRequest(string username, string password)
	{
		Username = username;
		Password = password;
	}
}
