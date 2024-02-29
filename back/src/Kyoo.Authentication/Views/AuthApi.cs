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
using System.IO;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Abstractions.Models.Exceptions;
using Kyoo.Abstractions.Models.Permissions;
using Kyoo.Abstractions.Models.Utils;
using Kyoo.Authentication.Models;
using Kyoo.Authentication.Models.DTO;
using Kyoo.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using static Kyoo.Abstractions.Models.Utils.Constants;
using BCryptNet = BCrypt.Net.BCrypt;

namespace Kyoo.Authentication.Views
{
	/// <summary>
	/// Sign in, Sign up or refresh tokens.
	/// </summary>
	[ApiController]
	[Route("auth")]
	[ApiDefinition("Authentication", Group = UsersGroup)]
	public class AuthApi(
		IRepository<User> users,
		ITokenController tokenController,
		IThumbnailsManager thumbs,
		PermissionOption options
	) : ControllerBase
	{
		/// <summary>
		/// Create a new Forbidden result from an object.
		/// </summary>
		/// <param name="value">The json value to output on the response.</param>
		/// <returns>A new forbidden result with the given json object.</returns>
		public static ObjectResult Forbid(object value)
		{
			return new ObjectResult(value) { StatusCode = StatusCodes.Status403Forbidden };
		}

		/// <summary>
		/// Oauth Login.
		/// </summary>
		/// <remarks>
		/// Login via a registered oauth provider.
		/// </remarks>
		/// <returns>A redirect to the provider's login page.</returns>
		/// <response code="404">The provider is not register with this instance of kyoo.</response>
		[HttpPost("login/{provider}")]
		[ProducesResponseType(StatusCodes.Status302Found)]
		[ProducesResponseType(StatusCodes.Status404NotFound, Type = typeof(RequestError))]
		public ActionResult<JwtToken> LoginVia(string provider)
		{
			if (!options.OIDC.ContainsKey(provider))
			{
				return NotFound(
					new RequestError(
						$"Invalid provider. {provider} is not registered no this instance of kyoo."
					)
				);
			}
			OidcProvider prov = options.OIDC[provider];
			char querySep = prov.AuthorizationUrl.Contains('?') ? '&' : '?';
			string url = $"{prov.AuthorizationUrl}{querySep}response_type=code";
			url += $"&client_id={prov.ClientId}";
			url += $"&redirect_uri={options.PublicUrl.TrimEnd('/')}/api/auth/callback/{provider}";
			if (prov.Scope is not null)
				url += $"&scope={prov.Scope}";
			return Redirect(url);
		}

		/// <summary>
		/// Oauth Login Callback.
		/// </summary>
		/// <remarks>
		/// This route is not meant to be called manually, the user should be redirected automatically here
		/// after a successful login on the /login/{provider} page.
		/// </remarks>
		/// <returns>A redirect to the provider's login page.</returns>
		/// <response code="403">The provider gave an error.</response>
		[HttpPost("callback/{provider}")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status403Forbidden, Type = typeof(RequestError))]
		public async Task<ActionResult<JwtToken>> OauthCallback(string provider, dynamic val)
		{
			throw new NotImplementedException();
			// User? user = await users.GetOrDefault(
			// 	new Filter<User>.Lambda(x => x.ExternalId[provider].Id == val.Id)
			// );
			// if (user == null)
			// 	user = await users.Create(val);
			// return new JwtToken(
			// 	tokenController.CreateAccessToken(user, out TimeSpan expireIn),
			// 	await tokenController.CreateRefreshToken(user),
			// 	expireIn
			// );
		}

		/// <summary>
		/// Login.
		/// </summary>
		/// <remarks>
		/// Login as a user and retrieve an access and a refresh token.
		/// </remarks>
		/// <param name="request">The body of the request.</param>
		/// <returns>A new access and a refresh token.</returns>
		/// <response code="403">The user and password does not match.</response>
		[HttpPost("login")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status403Forbidden, Type = typeof(RequestError))]
		public async Task<ActionResult<JwtToken>> Login([FromBody] LoginRequest request)
		{
			User? user = await users.GetOrDefault(
				new Filter<User>.Eq(nameof(Abstractions.Models.User.Username), request.Username)
			);
			if (user == null || !BCryptNet.Verify(request.Password, user.Password))
				return Forbid(new RequestError("The user and password does not match."));

			return new JwtToken(
				tokenController.CreateAccessToken(user, out TimeSpan expireIn),
				await tokenController.CreateRefreshToken(user),
				expireIn
			);
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
			user.Permissions = options.NewUser;
			try
			{
				await users.Create(user);
			}
			catch (DuplicatedItemException)
			{
				return Conflict(new RequestError("A user already exists with this username."));
			}

			return new JwtToken(
				tokenController.CreateAccessToken(user, out TimeSpan expireIn),
				await tokenController.CreateRefreshToken(user),
				expireIn
			);
		}

		/// <summary>
		/// Refresh a token.
		/// </summary>
		/// <remarks>
		/// Refresh an access token using the given refresh token. A new access and refresh token are generated.
		/// </remarks>
		/// <param name="token">A valid refresh token.</param>
		/// <returns>A new access and refresh token.</returns>
		/// <response code="403">The given refresh token is invalid.</response>
		[HttpGet("refresh")]
		[UserOnly]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status403Forbidden, Type = typeof(RequestError))]
		public async Task<ActionResult<JwtToken>> Refresh([FromQuery] string token)
		{
			try
			{
				Guid userId = tokenController.GetRefreshTokenUserID(token);
				User user = await users.Get(userId);
				return new JwtToken(
					tokenController.CreateAccessToken(user, out TimeSpan expireIn),
					await tokenController.CreateRefreshToken(user),
					expireIn
				);
			}
			catch (ItemNotFoundException)
			{
				return Forbid(new RequestError("Invalid refresh token."));
			}
			catch (SecurityTokenException ex)
			{
				return Forbid(new RequestError(ex.Message));
			}
		}

		/// <summary>
		/// Reset your password
		/// </summary>
		/// <remarks>
		/// Change your password.
		/// </remarks>
		/// <param name="request">The old and new password</param>
		/// <returns>Your account info.</returns>
		/// <response code="403">The old password is invalid.</response>
		[HttpPost("password-reset")]
		[UserOnly]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status403Forbidden, Type = typeof(RequestError))]
		public async Task<ActionResult<User>> ResetPassword([FromBody] PasswordResetRequest request)
		{
			User user = await users.Get(User.GetIdOrThrow());
			if (!BCryptNet.Verify(request.OldPassword, user.Password))
				return Forbid(new RequestError("The old password is invalid."));
			return await users.Patch(
				user.Id,
				(user) =>
				{
					user.Password = BCryptNet.HashPassword(request.NewPassword);
					return user;
				}
			);
		}

		/// <summary>
		/// Get authenticated user.
		/// </summary>
		/// <remarks>
		/// Get information about the currently authenticated user. This can also be used to ensure that you are
		/// logged in.
		/// </remarks>
		/// <returns>The currently authenticated user.</returns>
		/// <response code="401">The user is not authenticated.</response>
		/// <response code="403">The given access token is invalid.</response>
		[HttpGet("me")]
		[UserOnly]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status401Unauthorized, Type = typeof(RequestError))]
		[ProducesResponseType(StatusCodes.Status403Forbidden, Type = typeof(RequestError))]
		public async Task<ActionResult<User>> GetMe()
		{
			try
			{
				return await users.Get(User.GetIdOrThrow());
			}
			catch (ItemNotFoundException)
			{
				return Forbid(new RequestError("Invalid token"));
			}
		}

		/// <summary>
		/// Edit self
		/// </summary>
		/// <remarks>
		/// Edit information about the currently authenticated user.
		/// </remarks>
		/// <param name="user">The new data for the current user.</param>
		/// <returns>The currently authenticated user after modifications.</returns>
		/// <response code="401">The user is not authenticated.</response>
		/// <response code="403">The given access token is invalid.</response>
		[HttpPut("me")]
		[UserOnly]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status401Unauthorized, Type = typeof(RequestError))]
		[ProducesResponseType(StatusCodes.Status403Forbidden, Type = typeof(RequestError))]
		public async Task<ActionResult<User>> EditMe(User user)
		{
			try
			{
				user.Id = User.GetIdOrThrow();
				return await users.Edit(user);
			}
			catch (ItemNotFoundException)
			{
				return Forbid(new RequestError("Invalid token"));
			}
		}

		/// <summary>
		/// Patch self
		/// </summary>
		/// <remarks>
		/// Edit only provided informations about the currently authenticated user.
		/// </remarks>
		/// <param name="patch">The new data for the current user.</param>
		/// <returns>The currently authenticated user after modifications.</returns>
		/// <response code="401">The user is not authenticated.</response>
		/// <response code="403">The given access token is invalid.</response>
		[HttpPatch("me")]
		[UserOnly]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status401Unauthorized, Type = typeof(RequestError))]
		[ProducesResponseType(StatusCodes.Status403Forbidden, Type = typeof(RequestError))]
		public async Task<ActionResult<User>> PatchMe([FromBody] Patch<User> patch)
		{
			Guid userId = User.GetIdOrThrow();
			try
			{
				if (patch.Id.HasValue && patch.Id != userId)
					throw new ArgumentException("Can't edit your user id.");
				if (patch.ContainsKey(nameof(Abstractions.Models.User.Password)))
					throw new ArgumentException(
						"Can't edit your password via a PATCH. Use /auth/password-reset"
					);
				return await users.Patch(userId, patch.Apply);
			}
			catch (ItemNotFoundException)
			{
				return Forbid(new RequestError("Invalid token"));
			}
		}

		/// <summary>
		/// Delete account
		/// </summary>
		/// <remarks>
		/// Delete the current account.
		/// </remarks>
		/// <response code="401">The user is not authenticated.</response>
		/// <response code="403">The given access token is invalid.</response>
		[HttpDelete("me")]
		[UserOnly]
		[ProducesResponseType(StatusCodes.Status204NoContent)]
		[ProducesResponseType(StatusCodes.Status401Unauthorized, Type = typeof(RequestError))]
		[ProducesResponseType(StatusCodes.Status403Forbidden, Type = typeof(RequestError))]
		public async Task<ActionResult<User>> DeleteMe()
		{
			try
			{
				await users.Delete(User.GetIdOrThrow());
				return NoContent();
			}
			catch (ItemNotFoundException)
			{
				return Forbid(new RequestError("Invalid token"));
			}
		}

		/// <summary>
		/// Get profile picture
		/// </summary>
		/// <remarks>
		/// Get your profile picture
		/// </remarks>
		/// <response code="401">The user is not authenticated.</response>
		/// <response code="403">The given access token is invalid.</response>
		[HttpGet("me/logo")]
		[UserOnly]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status401Unauthorized, Type = typeof(RequestError))]
		[ProducesResponseType(StatusCodes.Status403Forbidden, Type = typeof(RequestError))]
		public async Task<ActionResult> GetProfilePicture()
		{
			Stream img = await thumbs.GetUserImage(User.GetIdOrThrow());
			// Allow clients to cache the image for 6 month.
			Response.Headers.Add("Cache-Control", $"public, max-age={60 * 60 * 24 * 31 * 6}");
			return File(img, "image/webp", true);
		}

		/// <summary>
		/// Set profile picture
		/// </summary>
		/// <remarks>
		/// Set your profile picture
		/// </remarks>
		/// <response code="401">The user is not authenticated.</response>
		/// <response code="403">The given access token is invalid.</response>
		[HttpPost("me/logo")]
		[UserOnly]
		[ProducesResponseType(StatusCodes.Status204NoContent)]
		[ProducesResponseType(StatusCodes.Status401Unauthorized, Type = typeof(RequestError))]
		[ProducesResponseType(StatusCodes.Status403Forbidden, Type = typeof(RequestError))]
		public async Task<ActionResult> SetProfilePicture(IFormFile picture)
		{
			if (picture == null || picture.Length == 0)
				return BadRequest();
			await thumbs.SetUserImage(User.GetIdOrThrow(), picture.OpenReadStream());
			return NoContent();
		}

		/// <summary>
		/// Delete profile picture
		/// </summary>
		/// <remarks>
		/// Delete your profile picture
		/// </remarks>
		/// <response code="401">The user is not authenticated.</response>
		/// <response code="403">The given access token is invalid.</response>
		[HttpDelete("me/logo")]
		[UserOnly]
		[ProducesResponseType(StatusCodes.Status204NoContent)]
		[ProducesResponseType(StatusCodes.Status401Unauthorized, Type = typeof(RequestError))]
		[ProducesResponseType(StatusCodes.Status403Forbidden, Type = typeof(RequestError))]
		public async Task<ActionResult> DeleteProfilePicture()
		{
			await thumbs.SetUserImage(User.GetIdOrThrow(), null);
			return NoContent();
		}
	}
}
