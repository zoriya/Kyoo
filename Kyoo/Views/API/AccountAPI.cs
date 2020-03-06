using System;
using System.Threading.Tasks;
using Kyoo.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Api
{
	public class RegisterRequest
	{
		public string Email;
		public string Username;
		public string Password;
	}
	
	[Route("api/[controller]")]
	[ApiController]
	public class AccountController : Controller
	{
		private readonly UserManager<Account> _accountManager;
		
		public AccountController(UserManager<Account> accountManager)
		{
			_accountManager = accountManager;
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
	}
}