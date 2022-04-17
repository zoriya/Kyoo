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
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Authentication;
using Kyoo.Authentication.Models.DTO;
using Kyoo.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using BCryptNet = BCrypt.Net.BCrypt;

namespace Amadeus.Server.Views.Auth;

/// <summary>
/// Sign in, Sign up or refresh tokens.
/// </summary>
[ApiController]
[Route("auth")]
public class AuthView : ControllerBase
{
	/// <summary>
	/// The repository used to check if the user exists.
	/// </summary>
	private readonly IUserRepository _users;

	/// <summary>
	/// The token generator.
	/// </summary>
	private readonly ITokenController _token;

	/// <summary>
	/// Create a new <see cref="AuthView"/>.
	/// </summary>
	/// <param name="users">The repository used to check if the user exists.</param>
	/// <param name="token">The token generator.</param>
	public AuthView(IUserRepository users, ITokenController token)
	{
		_users = users;
		_token = token;
	}

	/// <summary>
	/// Login.
	/// </summary>
	/// <remarks>
	/// Login as a user and retrieve an access and a refresh token.
	/// </remarks>
	/// <param name="request">The body of the request.</param>
	/// <returns>A new access and a refresh token.</returns>
	/// <response code="400">The user and password does not match.</response>
	[HttpPost("login")]
	[ProducesResponseType(StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	public async Task<ActionResult<JwtToken>> Login([FromBody] LoginRequest request)
	{
		User user = (await _users.GetAll()).FirstOrDefault(x => x.Username == request.Username);
		if (user != null && BCryptNet.Verify(request.Password, user.Password))
		{
			return new JwtToken
			{
				AccessToken = _token.CreateAccessToken(user, out TimeSpan expireDate),
				RefreshToken = await _token.CreateRefreshToken(user),
				ExpireIn = expireDate
			};
		}
		return BadRequest(new { Message = "The user and password does not match." });
	}

	/// <summary>
	/// Register.
	/// </summary>
	/// <remarks>
	/// Register a new user and get a new access/refresh token for this new user.
	/// </remarks>
	/// <param name="request">The body of the request.</param>
	/// <returns>A new access and a refresh token.</returns>
	/// <response code="400">The request is invalid.</response>
	/// <response code="409">A user already exists with this username or email address.</response>
	[HttpPost("register")]
	[ProducesResponseType(StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	[ProducesResponseType(StatusCodes.Status409Conflict)]
	public async Task<ActionResult<JwtToken>> Register([FromBody] RegisterRequest request)
	{
		User user = request.ToUser();
		user.Password = BCryptNet.HashPassword(request.Password);
		try
		{
			await _users.Create(user);
		}
		catch (DuplicateField)
		{
			return Conflict(new { Message = "A user already exists with this username." });
		}


		return new JwtToken
		{
			AccessToken = _token.CreateAccessToken(user, out TimeSpan expireDate),
			RefreshToken = await _token.CreateRefreshToken(user),
			ExpireIn = expireDate
		};
	}

	/// <summary>
	/// Refresh a token.
	/// </summary>
	/// <remarks>
	/// Refresh an access token using the given refresh token. A new access and refresh token are generated.
	/// The old refresh token should not be used anymore.
	/// </remarks>
	/// <param name="token">A valid refresh token.</param>
	/// <returns>A new access and refresh token.</returns>
	/// <response code="400">The given refresh token is invalid.</response>
	[HttpGet("refresh")]
	[ProducesResponseType(StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	public async Task<ActionResult<JwtToken>> Refresh([FromQuery] string token)
	{
		try
		{
			int userId = _token.GetRefreshTokenUserID(token);
			User user = await _users.GetById(userId);
			return new JwtToken
			{
				AccessToken = _token.CreateAccessToken(user, out TimeSpan expireDate),
				RefreshToken = await _token.CreateRefreshToken(user),
				ExpireIn = expireDate
			};
		}
		catch (ElementNotFound)
		{
			return BadRequest(new { Message = "Invalid refresh token." });
		}
		catch (SecurityTokenException ex)
		{
			return BadRequest(new { ex.Message });
		}
	}

	[HttpGet("anilist")]
	[ProducesResponseType(StatusCodes.Status302Found)]
	public IActionResult AniListLogin([FromQuery] Uri redirectUrl, [FromServices] IOptions<AniListOptions> anilist)
	{
		Dictionary<string, string> query = new()
		{
			["client_id"] = anilist.Value.ClientID,
			["redirect_uri"] = redirectUrl.ToString(),
			["response_type"] = "code"
		};
		return Redirect($"https://anilist.co/api/v2/oauth/authorize{query.ToQueryString()}");
	}

	[HttpPost("link/anilist")]
	[ProducesResponseType(StatusCodes.Status200OK)]
	[Authorize]
	public async Task<ActionResult<User>> AniListLink([FromQuery] string code, [FromServices] AniListService anilist)
	{
		// TODO prevent link if someone has already linked this account.
		// TODO allow unlink.
		if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out int userID))
			return BadRequest("Invalid access token");
		return await anilist.LinkAccount(userID, code);
	}

	[HttpPost("login/anilist")]
	[ProducesResponseType(StatusCodes.Status200OK)]
	public async Task<ActionResult<JwtToken>> AniListLogin([FromQuery] string code, [FromServices] AniListService anilist)
	{
		User user = await anilist.Login(code);
		return new JwtToken
		{
			AccessToken = _token.CreateAccessToken(user, out TimeSpan expireIn),
			RefreshToken = await _token.CreateRefreshToken(user),
			ExpireIn = expireIn
		};
	}

	[HttpGet("me")]
	[Authorize]
	[ProducesResponseType(StatusCodes.Status200OK)]
	public async Task<ActionResult<User>> GetMe()
	{
		if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out int userID))
			return BadRequest("Invalid access token");
		return await _users.GetById(userID);
	}
}
