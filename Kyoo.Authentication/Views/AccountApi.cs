using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using IdentityServer4.Extensions;
using IdentityServer4.Models;
using IdentityServer4.Services;
using Kyoo.Authentication.Models;
using Kyoo.Authentication.Models.DTO;
using Kyoo.Controllers;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Kyoo.Authentication.Views
{
	/// <summary>
	/// The class responsible for login, logout, permissions and claims of a user.
	/// </summary>
	[Route("api/account")]
	[Route("api/accounts")]
	[ApiController]
	public class AccountApi : Controller, IProfileService
	{
		/// <summary>
		/// The repository to handle users.
		/// </summary>
		private readonly IUserRepository _users;
		/// <summary>
		/// A file manager to send profile pictures
		/// </summary>
		private readonly IFileManager _files;
		/// <summary>
		/// Options about authentication. Those options are monitored and reloads are supported.
		/// </summary>
		private readonly IOptions<AuthenticationOption> _options;


		/// <summary>
		/// Create a new <see cref="AccountApi"/> handle to handle login/users requests.
		/// </summary>
		/// <param name="users">The user repository to create and manage users</param>
		/// <param name="files">A file manager to send profile pictures</param>
		/// <param name="options">Authentication options (this may be hot reloaded)</param>
		public AccountApi(IUserRepository users,
			IFileManager files,
			IOptions<AuthenticationOption> options)
		{
			_users = users;
			_files = files;
			_options = options;
		}
		
		
		/// <summary>
		/// Register a new user and return a OTAC to connect to it. 
		/// </summary>
		/// <param name="request">The DTO register request</param>
		/// <returns>A OTAC to connect to this new account</returns>
		[HttpPost("register")]
		public async Task<IActionResult> Register([FromBody] RegisterRequest request)
		{
			User user = request.ToUser();
			user.Permissions = _options.Value.Permissions.NewUser;
			user.Password = PasswordUtils.HashPassword(user.Password);
			user.ExtraData["otac"] = PasswordUtils.GenerateOTAC();
			user.ExtraData["otac-expire"] = DateTime.Now.AddMinutes(1).ToString("s");
			try
			{
				await _users.Create(user);
			}
			catch (DuplicatedItemException)
			{
				return Conflict(new {Errors = new {Duplicate = new[] {"A user with this name already exists"}}});
			}

			return Ok(new {Otac = user.ExtraData["otac"]});
		}

		/// <summary>
		/// Return an authentication properties based on a stay login property
		/// </summary>
		/// <param name="stayLogged">Should the user stay logged</param>
		/// <returns>Authentication properties based on a stay login</returns>
		private static AuthenticationProperties StayLogged(bool stayLogged)
		{
			if (!stayLogged)
				return null;
			return new AuthenticationProperties
			{
				IsPersistent = true,
				ExpiresUtc = DateTimeOffset.UtcNow.AddMonths(1)
			};
		}
		
		/// <summary>
		/// Login the user.
		/// </summary>
		/// <param name="login">The DTO login request</param>
		[HttpPost("login")]
		public async Task<IActionResult> Login([FromBody] LoginRequest login)
		{
			User user = await _users.GetOrDefault(x => x.Username == login.Username);

			if (user == null)
				return Unauthorized();
			if (!PasswordUtils.CheckPassword(login.Password, user.Password))
				return Unauthorized();

			await HttpContext.SignInAsync(user.ToIdentityUser(), StayLogged(login.StayLoggedIn));
			return Ok(new { RedirectUrl = login.ReturnURL, IsOk = true });
		}
		
		/// <summary>
		/// Use a OTAC to login a user.
		/// </summary>
		/// <param name="otac">The OTAC request</param>
		[HttpPost("otac-login")]
		public async Task<IActionResult> OtacLogin([FromBody] OtacRequest otac)
		{
			// TODO once hstore (Dictionary<string, string> accessor) are supported, use them.
			//      We retrieve all users, this is inefficient.
			User user = (await _users.GetAll()).FirstOrDefault(x => x.ExtraData.GetValueOrDefault("otac")  == otac.Otac);
			if (user == null)
				return Unauthorized();
			if (DateTime.ParseExact(user.ExtraData["otac-expire"], "s", CultureInfo.InvariantCulture) <=
			    DateTime.UtcNow)
			{
				return BadRequest(new
				{
					code = "ExpiredOTAC", description = "The OTAC has expired. Try to login with your password."
				});
			}
			
			await HttpContext.SignInAsync(user.ToIdentityUser(), StayLogged(otac.StayLoggedIn));
			return Ok();
		}
		
		/// <summary>
		/// Sign out an user
		/// </summary>
		[HttpGet("logout")]
		[Authorize]
		public async Task<IActionResult> Logout()
		{
			await HttpContext.SignOutAsync();
			return Ok();
		}

		/// <inheritdoc />
		public async Task GetProfileDataAsync(ProfileDataRequestContext context)
		{
			User user = await _users.GetOrDefault(int.Parse(context.Subject.GetSubjectId()));
			if (user == null)
				return;
			context.IssuedClaims.AddRange(user.GetClaims());
			context.IssuedClaims.Add(new Claim("permissions", string.Join(',', user.Permissions)));
		}

		/// <inheritdoc />
		public async Task IsActiveAsync(IsActiveContext context)
		{
			User user = await _users.GetOrDefault(int.Parse(context.Subject.GetSubjectId()));
			context.IsActive = user != null;
		}
		
		/// <summary>
		/// Get the user's profile picture.
		/// </summary>
		/// <param name="slug">The user slug</param>
		/// <returns>The profile picture of the user or 404 if not found</returns>
		[HttpGet("picture/{slug}")]
		public async Task<IActionResult> GetPicture(string slug)
		{
			User user = await _users.GetOrDefault(slug);
			if (user == null)
				return NotFound();
			string path = Path.Combine(_options.Value.ProfilePicturePath, user.ID.ToString());
			return _files.FileResult(path);
		}
		
		/// <summary>
		/// Update profile information (email, username, profile picture...)
		/// </summary>
		/// <param name="data">The new information</param>
		/// <returns>The edited user</returns>
		[HttpPut]
		[Authorize]
		public async Task<ActionResult<User>> Update([FromForm] AccountUpdateRequest data)
		{
			User user = await _users.GetOrDefault(int.Parse(HttpContext.User.GetSubjectId()));

			if (user == null)
				return Unauthorized();
			if (!string.IsNullOrEmpty(data.Email))
				user.Email = data.Email;
			if (!string.IsNullOrEmpty(data.Username))
				user.Username = data.Username;
			if (data.Picture?.Length > 0)
			{
				string path = Path.Combine(_options.Value.ProfilePicturePath, user.ID.ToString());
				await using Stream file = _files.NewFile(path);
				await data.Picture.CopyToAsync(file);
			}
			return await _users.Edit(user, false);
		}

		/// <summary>
		/// Get permissions for a non connected user.
		/// </summary>
		/// <returns>The list of permissions of a default user.</returns>
		[HttpGet("permissions")]
		public ActionResult<IEnumerable<string>> GetDefaultPermissions()
		{
			return _options.Value.Permissions.Default ?? Array.Empty<string>();
		}
	}
}