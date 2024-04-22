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
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Kyoo.Abstractions.Models;
using Kyoo.Authentication.Models;
using Microsoft.IdentityModel.Tokens;

namespace Kyoo.Authentication;

public class TokenController(ServerOptions options) : ITokenController
{
	/// <inheritdoc />
	public string CreateAccessToken(User user, out TimeSpan expireIn)
	{
		expireIn = new TimeSpan(1, 0, 0);

		SymmetricSecurityKey key = new(options.Secret);
		SigningCredentials credential = new(key, SecurityAlgorithms.HmacSha256Signature);
		string permissions =
			user.Permissions != null ? string.Join(',', user.Permissions) : string.Empty;
		List<Claim> claims =
			new()
			{
				new Claim(Claims.Id, user.Id.ToString()),
				new Claim(Claims.Name, user.Username),
				new Claim(Claims.Permissions, permissions),
				new Claim(Claims.Type, "access")
			};
		if (user.Email != null)
			claims.Add(new Claim(Claims.Email, user.Email));
		JwtSecurityToken token =
			new(
				signingCredentials: credential,
				claims: claims,
				expires: DateTime.UtcNow.Add(expireIn)
			);
		return new JwtSecurityTokenHandler().WriteToken(token);
	}

	/// <inheritdoc />
	public Task<string> CreateRefreshToken(User user)
	{
		SymmetricSecurityKey key = new(options.Secret);
		SigningCredentials credential = new(key, SecurityAlgorithms.HmacSha256Signature);
		JwtSecurityToken token =
			new(
				signingCredentials: credential,
				claims: new[]
				{
					new Claim(Claims.Id, user.Id.ToString()),
					new Claim(Claims.Guid, Guid.NewGuid().ToString()),
					new Claim(Claims.Type, "refresh")
				},
				expires: DateTime.UtcNow.AddYears(1)
			);
		// TODO: refresh keys are unique (thanks to the guid) but we could store them in DB to invalidate them if requested by the user.
		return Task.FromResult(new JwtSecurityTokenHandler().WriteToken(token));
	}

	/// <inheritdoc />
	public Guid GetRefreshTokenUserID(string refreshToken)
	{
		SymmetricSecurityKey key = new(options.Secret);
		JwtSecurityTokenHandler tokenHandler = new();
		ClaimsPrincipal principal;
		try
		{
			principal = tokenHandler.ValidateToken(
				refreshToken,
				new TokenValidationParameters
				{
					ValidateIssuer = false,
					ValidateAudience = false,
					ValidateIssuerSigningKey = true,
					ValidateLifetime = true,
					IssuerSigningKey = key
				},
				out SecurityToken _
			);
		}
		catch (Exception)
		{
			throw new SecurityTokenException("Invalid refresh token");
		}

		if (principal.Claims.First(x => x.Type == Claims.Type).Value != "refresh")
			throw new SecurityTokenException(
				"Invalid token type. The token should be a refresh token."
			);
		Claim identifier = principal.Claims.First(x => x.Type == Claims.Id);
		if (Guid.TryParse(identifier.Value, out Guid id))
			return id;
		throw new SecurityTokenException("Token not associated to any user.");
	}
}
