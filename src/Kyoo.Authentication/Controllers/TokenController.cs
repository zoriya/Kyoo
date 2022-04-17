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
using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Kyoo.Abstractions;
using Kyoo.Abstractions.Models;
using Kyoo.Authentication.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Kyoo.Authentication;

/// <summary>
/// The service that controls jwt creation and validation.
/// </summary>
public class TokenController : ITokenController
{
	/// <summary>
	/// The options that this controller will use.
	/// </summary>
	private readonly IOptions<AuthenticationOption> _options;

	/// <summary>
	/// The configuration used to retrieve the public URL of kyoo.
	/// </summary>
	private readonly IConfiguration _configuration;

	/// <summary>
	/// Create a new <see cref="TokenController"/>.
	/// </summary>
	/// <param name="options">The options that this controller will use.</param>
	/// <param name="configuration">The configuration used to retrieve the public URL of kyoo.</param>
	public TokenController(IOptions<AuthenticationOption> options, IConfiguration configuration)
	{
		_options = options;
		_configuration = configuration;
	}

	/// <inheritdoc />
	public string CreateAccessToken(User user, out TimeSpan expireIn)
	{
		if (user == null)
			throw new ArgumentNullException(nameof(user));

		expireIn = new TimeSpan(1, 0, 0);

		SymmetricSecurityKey key = new(Encoding.UTF8.GetBytes(_options.Value.Secret));
		SigningCredentials credential = new(key, SecurityAlgorithms.HmacSha256Signature);
		string permissions = user.Permissions != null
			? string.Join(',', user.Permissions)
			: string.Empty;
		List<Claim> claims = new()
		{
			new Claim(ClaimTypes.NameIdentifier, user.ID.ToString(CultureInfo.InvariantCulture)),
			new Claim(ClaimTypes.Name, user.Username),
			new Claim(ClaimTypes.Role, permissions),
			new Claim("type", "access")
		};
		if (user.Email != null)
			claims.Add(new Claim(ClaimTypes.Email, user.Email));
		JwtSecurityToken token = new(
			signingCredentials: credential,
			issuer: _configuration.GetPublicUrl().ToString(),
			audience: _configuration.GetPublicUrl().ToString(),
			claims: claims,
			expires: DateTime.UtcNow.Add(expireIn)
		);
		return new JwtSecurityTokenHandler().WriteToken(token);
	}

	/// <inheritdoc />
	public Task<string> CreateRefreshToken(User user)
	{
		if (user == null)
			throw new ArgumentNullException(nameof(user));

		SymmetricSecurityKey key = new(Encoding.UTF8.GetBytes(_options.Value.Secret));
		SigningCredentials credential = new(key, SecurityAlgorithms.HmacSha256Signature);
		JwtSecurityToken token = new(
			signingCredentials: credential,
			issuer: _configuration.GetPublicUrl().ToString(),
			audience: _configuration.GetPublicUrl().ToString(),
			claims: new[]
			{
				new Claim(ClaimTypes.NameIdentifier, user.ID.ToString(CultureInfo.InvariantCulture)),
				new Claim("guid", Guid.NewGuid().ToString()),
				new Claim("type", "refresh")
			},
			expires: DateTime.UtcNow.AddYears(1)
		);
		// TODO refresh keys are unique (thanks to the guid) but we could store them in DB to invalidate them if requested by the user.
		return Task.FromResult(new JwtSecurityTokenHandler().WriteToken(token));
	}

	/// <inheritdoc />
	public int GetRefreshTokenUserID(string refreshToken)
	{
		SymmetricSecurityKey key = new(Encoding.UTF8.GetBytes(_options.Value.Secret));
		JwtSecurityTokenHandler tokenHandler = new();
		ClaimsPrincipal principal;
		try
		{
			principal = tokenHandler.ValidateToken(refreshToken, new TokenValidationParameters
			{
				ValidateIssuer = true,
				ValidateAudience = true,
				ValidateIssuerSigningKey = true,
				ValidateLifetime = true,
				ValidIssuer = _configuration.GetPublicUrl().ToString(),
				ValidAudience = _configuration.GetPublicUrl().ToString(),
				IssuerSigningKey = key
			}, out SecurityToken _);
		}
		catch (Exception ex)
		{
			throw new SecurityTokenException(ex.Message);
		}

		if (principal.Claims.First(x => x.Type == "type").Value != "refresh")
			throw new SecurityTokenException("Invalid token type. The token should be a refresh token.");
		Claim identifier = principal.Claims.First(x => x.Type == ClaimTypes.NameIdentifier);
		if (int.TryParse(identifier.Value, out int id))
			return id;
		throw new SecurityTokenException("Token not associated to any user.");
	}
}
