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
using System.ComponentModel.DataAnnotations;
using Kyoo.Abstractions.Models;
using Kyoo.Utils;
using BCryptNet = BCrypt.Net.BCrypt;

namespace Kyoo.Authentication.Models.DTO
{
	/// <summary>
	/// A model only used on register requests.
	/// </summary>
	public class RegisterRequest
	{
		/// <summary>
		/// The user email address
		/// </summary>
		[EmailAddress(ErrorMessage = "The email must be a valid email address")]
		public string Email { get; set; }

		/// <summary>
		/// The user's username.
		/// </summary>
		[MinLength(4, ErrorMessage = "The username must have at least {1} characters")]
		public string Username { get; set; }

		/// <summary>
		/// The user's password.
		/// </summary>
		[MinLength(4, ErrorMessage = "The password must have at least {1} characters")]
		public string Password { get; set; }

		/// <summary>
		/// Initializes a new instance of the <see cref="RegisterRequest"/> class.
		/// </summary>
		/// <param name="email">The user email address.</param>
		/// <param name="username">The user's username.</param>
		/// <param name="password">The user's password.</param>
		public RegisterRequest(string email, string username, string password)
		{
			Email = email;
			Username = username;
			Password = password;
		}

		/// <summary>
		/// Convert this register request to a new <see cref="User"/> class.
		/// </summary>
		/// <returns>A user representing this request.</returns>
		public User ToUser()
		{
			return new User
			{
				Slug = Utility.ToSlug(Username),
				Username = Username,
				Password = BCryptNet.HashPassword(Password),
				Email = Email,
			};
		}
	}
}
