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

using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace Kyoo.Authentication.Models.DTO
{
	/// <summary>
	/// A model only used on account update requests.
	/// </summary>
	public class AccountUpdateRequest
	{
		/// <summary>
		/// The new email address of the user
		/// </summary>
		[EmailAddress(ErrorMessage = "The email is invalid.")]
		public string Email { get; set; }

		/// <summary>
		/// The new username of the user.
		/// </summary>
		[MinLength(4, ErrorMessage = "The username must have at least 4 characters")]
		public string Username { get; set; }

		/// <summary>
		/// The picture icon.
		/// </summary>
		public IFormFile Picture { get; set; }
	}
}
