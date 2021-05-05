// using System;
// using System.Collections.Generic;
// using System.IO;
// using System.Linq;
// using System.Security.Claims;
// using System.Threading.Tasks;
// using IdentityServer4.Models;
// using IdentityServer4.Services;
// using Kyoo.Authentication.Models.DTO;
// using Kyoo.Models;
// using Microsoft.AspNetCore.Authorization;
// using Microsoft.AspNetCore.Http;
// using Microsoft.AspNetCore.Identity;
// using Microsoft.AspNetCore.Mvc;
// using Microsoft.Extensions.Configuration;
// using SignInResult = Microsoft.AspNetCore.Identity.SignInResult;
//
// namespace Kyoo.Authentication.Views
// {
// 	public class LoginRequest
// 	{
// 		public string Username { get; set; }
// 		public string Password { get; set; }
// 		public bool StayLoggedIn { get; set; }
// 	}
//
// 	public class OtacRequest
// 	{
// 		public string Otac { get; set; }
// 		public bool StayLoggedIn { get; set; }
// 	}
// 	
// 	public class AccountData
// 	{
// 		[FromForm(Name = "email")]
// 		public string Email { get; set; }
// 		[FromForm(Name = "username")]
// 		public string Username { get; set; }
// 		[FromForm(Name = "picture")]
// 		public IFormFile Picture { get; set; }
// 	}
//
//
// 	/// <summary>
// 	/// The class responsible for login, logout, permissions and claims of a user.
// 	/// </summary>
// 	[Route("api/account")]
// 	[Route("api/accounts")]
// 	[ApiController]
// 	public class AccountApi : Controller, IProfileService
// 	{
// 		private readonly UserManager<User> _userManager;
// 		private readonly SignInManager<User> _signInManager;
// 		private readonly IConfiguration _configuration;
// 		private readonly string _picturePath;
//
// 		// TODO find how SignInManager & UserManager are implement and check if they can be used or not.
// 		public AccountApi(UserManager<User> userManager, 
// 			SignInManager<User> signInManager, 
// 			IConfiguration configuration)
// 		{
// 			_userManager = userManager;
// 			_signInManager = signInManager;
// 			_picturePath = configuration.GetValue<string>("profilePicturePath");
// 			_configuration = configuration;
// 			if (!Path.IsPathRooted(_picturePath))
// 				_picturePath = Path.GetFullPath(_picturePath);
// 		}
// 		
// 		[HttpPost("register")]
// 		public async Task<IActionResult> Register([FromBody] RegisterRequest request)
// 		{
// 			User user = request.ToUser();
// 			IdentityResult result = await _userManager.CreateAsync(user, user.Password);
// 			if (!result.Succeeded)
// 				return BadRequest(result.Errors);
// 			string otac = account.GenerateOTAC(TimeSpan.FromMinutes(1));
// 			await _userManager.UpdateAsync(account);
// 			await _userManager.AddClaimAsync(account, new Claim(
// 				"permissions",
// 				_configuration.GetValue<string>("newUserPermissions")));
// 			return Ok(new {otac});
// 		}
// 		
// 		[HttpPost("login")]
// 		public async Task<IActionResult> Login([FromBody] LoginRequest login)
// 		{
// 			if (!ModelState.IsValid)
// 				return BadRequest(login);
// 			SignInResult result = await _signInManager
// 				.PasswordSignInAsync(login.Username, login.Password, login.StayLoggedIn, false);
// 			if (result.Succeeded)
// 				return Ok();
// 			return BadRequest(new [] { new {code = "InvalidCredentials", description = "Invalid username/password"}});
// 		}
// 		
// 		[HttpPost("otac-login")]
// 		public async Task<IActionResult> OtacLogin([FromBody] OtacRequest otac)
// 		{
// 			if (!ModelState.IsValid)
// 				return BadRequest(otac);
// 			User user = _userManager.Users.FirstOrDefault(x => x.OTAC == otac.Otac);
// 			if (user == null)
// 				return BadRequest(new [] { new {code = "InvalidOTAC", description = "No user was found for this OTAC."}});
// 			if (user.OTACExpires <= DateTime.UtcNow)
// 				return BadRequest(new [] { new {code = "ExpiredOTAC", description = "The OTAC has expired. Try to login with your password."}});
// 			await _signInManager.SignInAsync(user, otac.StayLoggedIn);
// 			return Ok();
// 		}
// 		
// 		[HttpGet("logout")]
// 		[Authorize]
// 		public async Task<IActionResult> Logout()
// 		{
// 			await _signInManager.SignOutAsync();
// 			return Ok();
// 		}
//
// 		public async Task GetProfileDataAsync(ProfileDataRequestContext context)
// 		{
// 			User user = await _userManager.GetUserAsync(context.Subject);
// 			if (user != null)
// 			{
// 				List<Claim> claims = new()
// 				{
// 					new Claim("email", user.Email),
// 					new Claim("username", user.UserName),
// 					new Claim("picture", $"api/account/picture/{user.UserName}")
// 				};
//
// 				Claim perms = (await _userManager.GetClaimsAsync(user)).FirstOrDefault(x => x.Type == "permissions");
// 				if (perms != null)
// 					claims.Add(perms);
// 				
// 				context.IssuedClaims.AddRange(claims);
// 			}
// 		}
//
// 		public async Task IsActiveAsync(IsActiveContext context)
// 		{
// 			User user = await _userManager.GetUserAsync(context.Subject);
// 			context.IsActive = user != null;
// 		}
// 		
// 		[HttpGet("picture/{username}")]
// 		public async Task<IActionResult> GetPicture(string username)
// 		{
// 			User user = await _userManager.FindByNameAsync(username);
// 			if (user == null)
// 				return BadRequest();
// 			string path = Path.Combine(_picturePath, user.Id);
// 			if (!System.IO.File.Exists(path))
// 				return NotFound();
// 			return new PhysicalFileResult(path, "image/png");
// 		}
// 		
// 		[HttpPost("update")]
// 		[Authorize]
// 		public async Task<IActionResult> Update([FromForm] AccountData data)
// 		{
// 			User user = await _userManager.GetUserAsync(HttpContext.User);
// 			
// 			if (!string.IsNullOrEmpty(data.Email))
// 				user.Email =  data.Email;
// 			if (!string.IsNullOrEmpty(data.Username))
// 				user.UserName = data.Username;
// 			if (data.Picture?.Length > 0)
// 			{
// 				string path = Path.Combine(_picturePath, user.Id);
// 				await using FileStream file = System.IO.File.Create(path);
// 				await data.Picture.CopyToAsync(file);
// 			}
// 			await _userManager.UpdateAsync(user);
// 			return Ok();
// 		}
//
// 		[HttpGet("default-permissions")]
// 		public ActionResult<IEnumerable<string>> GetDefaultPermissions()
// 		{
// 			return _configuration.GetValue<string>("defaultPermissions").Split(",");
// 		}
// 	}
// }