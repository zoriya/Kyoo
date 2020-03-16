using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Claims;
using System.Threading.Tasks;
using IdentityServer4.Models;
using IdentityServer4.Services;
using Kyoo.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using SignInResult = Microsoft.AspNetCore.Identity.SignInResult;

namespace Kyoo.Api
{
	public class RegisterRequest
	{
		public string Email;
		public string Username;
		public string Password;
	}	
	
	public class LoginRequest
	{
		public string Username;
		public string Password;
		public bool StayLoggedIn;
	}
	
	public class AccountData
	{
		[FromQuery(Name = "email")]
		public string Email { get; set; }
		[FromQuery(Name = "username")]
		public string Username { get; set; }
		[FromQuery(Name = "picture")]
		public IFormFile Picture { get; set; }
	}
	
	[Route("api/[controller]")]
	[ApiController]
	public class AccountController : Controller, IProfileService
	{
		private readonly UserManager<User> _userManager;
		private readonly SignInManager<User> _signInManager;
		private readonly string _picturePath;
		
		public AccountController(UserManager<User> userManager, SignInManager<User> siginInManager, IConfiguration configuration)
		{
			_userManager = userManager;
			_signInManager = siginInManager;
			_picturePath = configuration.GetValue<string>("profilePicturePath");

		}
		
		[HttpPost("register")]
		public async Task<IActionResult> Register([FromBody] RegisterRequest user)
		{
			if (!ModelState.IsValid)
				return BadRequest(user);
			User account = new User {UserName = user.Username, Email = user.Email};
			IdentityResult result = await _userManager.CreateAsync(account, user.Password);
			if (!result.Succeeded)
				return BadRequest(result.Errors);
			string otac = account.GenerateOTAC(TimeSpan.FromMinutes(1));
			await _userManager.UpdateAsync(account);
			return Ok(otac);
		}
		
		[HttpPost("login")]
		public async Task<IActionResult> Login([FromBody] LoginRequest login)
		{
			if (!ModelState.IsValid)
				return BadRequest(login);
			SignInResult result = await _signInManager.PasswordSignInAsync(login.Username, login.Password, login.StayLoggedIn, false);
			if (!result.Succeeded)
				return BadRequest("Invalid username/password");
			return Ok();
		}
		
		[HttpGet("logout")]
		[Authorize]
		public async Task<IActionResult> Logout()
		{
			await _signInManager.SignOutAsync();
			return Ok();
		}

		public async Task GetProfileDataAsync(ProfileDataRequestContext context)
		{
			User user = await _userManager.GetUserAsync(context.Subject);
			if (user != null)
			{
				List<Claim> claims = new List<Claim>
				{
					new Claim("email", user.Email),
					new Claim("username", user.UserName),
					new Claim("picture", $"api/account/picture/{user.UserName}")
				};

				context.IssuedClaims.AddRange(claims);
			}
		}

		public async Task IsActiveAsync(IsActiveContext context)
		{
			User user = await _userManager.GetUserAsync(context.Subject);
			context.IsActive = user != null;
		}
		
		[HttpGet("picture/{username}")]
		public async Task<IActionResult> GetPicture(string username)
		{
			User user = await _userManager.FindByNameAsync(username);
			if (user == null)
				return BadRequest();
			return new PhysicalFileResult(Path.Combine(_picturePath, user.Id), "image/png");
		}
		
		[HttpPost("update")]
		[Authorize]
		public async Task<IActionResult> Update([FromForm] AccountData data)
		{
			User user = await _userManager.GetUserAsync(HttpContext.User);
			
			if (!string.IsNullOrEmpty(data.Email))
				user.Email =  data.Email;
			if (!string.IsNullOrEmpty(data.Username))
				user.UserName = data.Username;
			if (data.Picture?.Length > 0)
			{
				string path = Path.Combine(_picturePath, user.Id);
				await using (FileStream file = System.IO.File.Create(path))
				{
					await data.Picture.CopyToAsync(file);
				}
			}
			await _userManager.UpdateAsync(user);
			return Ok();
		}
	}
}