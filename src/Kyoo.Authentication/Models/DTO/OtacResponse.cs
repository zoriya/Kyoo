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

namespace Kyoo.Authentication.Models.DTO
{
	/// <summary>
	/// A one time access token
	/// </summary>
	public class OtacResponse
	{
		/// <summary>
		/// The One Time Access Token that allow one to connect to an account without typing a password or without
		/// any kind of verification. This is valid only one time and only for a short period of time.
		/// </summary>
		public string OTAC { get; set; }

		/// <summary>
		/// Create a new <see cref="OtacResponse"/>.
		/// </summary>
		/// <param name="otac">The one time access token.</param>
		public OtacResponse(string otac)
		{
			OTAC = otac;
		}
	}
}
