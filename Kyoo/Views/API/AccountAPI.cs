using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using IdentityServer4.Extensions;
using IdentityServer4.Models;
using IdentityServer4.Services;
using Kyoo.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
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
	
	[Route("api/[controller]")]
	[ApiController]
	public class AccountController : Controller, IProfileService
	{
		private readonly UserManager<User> _userManager;
		private readonly SignInManager<User> _signInManager;
		
		public AccountController(UserManager<User> userManager, SignInManager<User> siginInManager)
		{
			_userManager = userManager;
			_signInManager = siginInManager;
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
				};

				context.IssuedClaims.AddRange(claims);
			}
		}

		public async Task IsActiveAsync(IsActiveContext context)
		{
			User user = await _userManager.GetUserAsync(context.Subject);
			context.IsActive = user != null;
		}
	}
}