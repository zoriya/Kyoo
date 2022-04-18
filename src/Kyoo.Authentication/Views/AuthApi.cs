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
using System.Security.Claims;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Abstractions.Models.Exceptions;
using Kyoo.Abstractions.Models.Utils;
using Kyoo.Authentication.Models.DTO;
using Kyoo.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using static Kyoo.Abstractions.Models.Utils.Constants;
using BCryptNet = BCrypt.Net.BCrypt;

namespace Kyoo.Authentication.Views
{
	/// <summary>
	/// Sign in, Sign up or refresh tokens.
	/// </summary>
	[ApiController]
	[Route("api/auth")]
	[ApiDefinition("Authentication", Group = UsersGroup)]
	public class AuthApi : ControllerBase
	{
		/// <summary>
		/// The repository to handle users.
		/// </summary>
		private readonly IUserRepository _users;

		/// <summary>
		/// The token generator.
		/// </summary>
		private readonly ITokenController _token;

		/// <summary>
		/// Create a new <see cref="AuthApi"/>.
		/// </summary>
		/// <param name="users">The repository used to check if the user exists.</param>
		/// <param name="token">The token generator.</param>
		public AuthApi(IUserRepository users, ITokenController token)
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
		[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
		public async Task<ActionResult<JwtToken>> Login([FromBody] LoginRequest request)
		{
			User user = await _users.GetOrDefault(x => x.Username == request.Username);
			if (user == null || !BCryptNet.Verify(request.Password, user.Password))
				return BadRequest(new RequestError("The user and password does not match."));

			return new JwtToken
			{
				AccessToken = _token.CreateAccessToken(user, out TimeSpan expireIn),
				RefreshToken = await _token.CreateRefreshToken(user),
				ExpireIn = expireIn
			};
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
		[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
		[ProducesResponseType(StatusCodes.Status409Conflict, Type = typeof(RequestError))]
		public async Task<ActionResult<JwtToken>> Register([FromBody] RegisterRequest request)
		{
			User user = request.ToUser();
			try
			{
				await _users.Create(user);
			}
			catch (DuplicatedItemException)
			{
				return Conflict(new RequestError("A user already exists with this username."));
			}

			return new JwtToken
			{
				AccessToken = _token.CreateAccessToken(user, out TimeSpan expireIn),
				RefreshToken = await _token.CreateRefreshToken(user),
				ExpireIn = expireIn
			};
		}

		/// <summary>
		/// Refresh a token.
		/// </summary>
		/// <remarks>
		/// Refresh an access token using the given refresh token. A new access and refresh token are generated.
		/// </remarks>
		/// <param name="token">A valid refresh token.</param>
		/// <returns>A new access and refresh token.</returns>
		/// <response code="400">The given refresh token is invalid.</response>
		[HttpGet("refresh")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
		public async Task<ActionResult<JwtToken>> Refresh([FromQuery] string token)
		{
			try
			{
				int userId = _token.GetRefreshTokenUserID(token);
				User user = await _users.Get(userId);
				return new JwtToken
				{
					AccessToken = _token.CreateAccessToken(user, out TimeSpan expireIn),
					RefreshToken = await _token.CreateRefreshToken(user),
					ExpireIn = expireIn
				};
			}
			catch (ItemNotFoundException)
			{
				return BadRequest(new RequestError("Invalid refresh token."));
			}
			catch (SecurityTokenException ex)
			{
				return BadRequest(new RequestError(ex.Message));
			}
		}

		/// <summary>
		/// Get authenticated user.
		/// </summary>
		/// <remarks>
		/// Get information about the currently authenticated user. This can also be used to ensure that you are
		/// logged in.
		/// </remarks>
		/// <returns>The currently authenticated user.</returns>
		/// <response code="403">The given access token is invalid.</response>
		[HttpGet("me")]
		[Authorize]
		[ProducesResponseType(StatusCodes.Status200OK)]
		public async Task<ActionResult<User>> GetMe()
		{
			if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out int userID))
				return Forbid();
			return await _users.Get(userID);
		}
	}
}
