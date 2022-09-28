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
using System.Text.Json.Serialization;
using Newtonsoft.Json;

namespace Kyoo.Authentication
{
	/// <summary>
	/// A container representing the response of a login or token refresh.
	/// </summary>
	public class JwtToken
	{
		/// <summary>
		/// The type of this token (always a Bearer).
		/// </summary>
		[JsonProperty("token_token")]
		[JsonPropertyName("token_type")]
		public string TokenType => "Bearer";

		/// <summary>
		/// The access token used to authorize requests.
		/// </summary>
		[JsonProperty("access_token")]
		[JsonPropertyName("access_token")]
		public string AccessToken { get; set; }

		/// <summary>
		/// The refresh token used to retrieve a new access/refresh token when the access token has expired.
		/// </summary>
		[JsonProperty("refresh_token")]
		[JsonPropertyName("refresh_token")]
		public string RefreshToken { get; set; }

		/// <summary>
		/// When the access token will expire. After this time, the refresh token should be used to retrieve.
		/// a new token.cs
		/// </summary>
		[JsonProperty("expire_in")]
		[JsonPropertyName("expire_in")]
		public TimeSpan ExpireIn { get; set; }

		/// <summary>
		/// Initializes a new instance of the <see cref="JwtToken"/> class.
		/// </summary>
		/// <param name="accessToken">The access token used to authorize requests.</param>
		/// <param name="refreshToken">The refresh token to retrieve a new access token.</param>
		/// <param name="expireIn">When the access token will expire.</param>
		public JwtToken(string accessToken, string refreshToken, TimeSpan expireIn)
		{
			AccessToken = accessToken;
			RefreshToken = refreshToken;
			ExpireIn = expireIn;
		}
	}
}
