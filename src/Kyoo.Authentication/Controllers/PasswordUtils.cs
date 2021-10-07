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
using System.Linq;
using System.Security.Cryptography;
using IdentityModel;

namespace Kyoo.Authentication
{
	/// <summary>
	/// Some functions to handle password management.
	/// </summary>
	public static class PasswordUtils
	{
		/// <summary>
		/// Generate an OneTimeAccessCode.
		/// </summary>
		/// <returns>A new otac.</returns>
		public static string GenerateOTAC()
		{
			return CryptoRandom.CreateUniqueId();
		}

		/// <summary>
		/// Hash a password to store it has a verification only.
		/// </summary>
		/// <param name="password">The password to hash</param>
		/// <returns>The hashed password</returns>
		public static string HashPassword(string password)
		{
			byte[] salt = new byte[16];
			new RNGCryptoServiceProvider().GetBytes(salt);
			Rfc2898DeriveBytes pbkdf2 = new(password, salt, 100000);
			byte[] hash = pbkdf2.GetBytes(20);
			byte[] hashBytes = new byte[36];
			Array.Copy(salt, 0, hashBytes, 0, 16);
			Array.Copy(hash, 0, hashBytes, 16, 20);
			return Convert.ToBase64String(hashBytes);
		}

		/// <summary>
		/// Check if a password is the same as a valid hashed password.
		/// </summary>
		/// <param name="password">The password to check</param>
		/// <param name="validPassword">
		/// The valid hashed password. This password must be hashed via <see cref="HashPassword"/>.
		/// </param>
		/// <returns>True if the password is valid, false otherwise.</returns>
		public static bool CheckPassword(string password, string validPassword)
		{
			byte[] validHash = Convert.FromBase64String(validPassword);
			byte[] salt = new byte[16];
			Array.Copy(validHash, 0, salt, 0, 16);
			Rfc2898DeriveBytes pbkdf2 = new(password, salt, 100000);
			byte[] hash = pbkdf2.GetBytes(20);
			return hash.SequenceEqual(validHash.Skip(16));
		}
	}
}
