using System;
using System.Threading.Tasks;
using Kyoo.Models;
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
	public class AccountController : Controller
	{
		private readonly UserManager<Account> _accountManager;
		private readonly SignInManager<Account> _signInManager;
		
		public AccountController(UserManager<Account> accountManager, SignInManager<Account> siginInManager)
		{
			_accountManager = accountManager;
			_signInManager = siginInManager;
		}
		
		[HttpPost("register")]
		public async Task<IActionResult> Register([FromBody] RegisterRequest user)
		{
			if (!ModelState.IsValid)
				return BadRequest(user);
			Account account = new Account {UserName = user.Username, Email = user.Email};
			IdentityResult result = await _accountManager.CreateAsync(account, user.Password);
			if (!result.Succeeded)
				return BadRequest(result.Errors);
			string otac = account.GenerateOTAC(TimeSpan.FromMinutes(1));
			await _accountManager.UpdateAsync(account);
			return Ok(otac);
		}
		
		[HttpPost("login")]
		public async Task<IActionResult> Login([FromBody] LoginRequest login)
		{
			if (!ModelState.IsValid)
				return BadRequest(login);
			SignInResult result = await _signInManager.PasswordSignInAsync(login.Username, login.Password, login.StayLoggedIn, false);
			if (result.Succeeded)
				return Ok();
			return BadRequest("Invalid username/password");
		}
	}
}