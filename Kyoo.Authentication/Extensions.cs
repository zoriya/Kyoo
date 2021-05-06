using System.Collections.Generic;
using System.Security.Claims;
using IdentityModel;
using Kyoo.Models;

namespace Kyoo.Authentication
{
	/// <summary>
	/// Extension methods.
	/// </summary>
	public static class Extensions
	{
		public static ClaimsPrincipal ToPrincipal(this User user)
		{
			List<Claim> claims = new()
			{
				new Claim(JwtClaimTypes.Subject, user.ID.ToString()),
				new Claim(JwtClaimTypes.Name, user.Username),
				new Claim(JwtClaimTypes.Picture, $"api/account/picture/{user.Slug}")
			};

			ClaimsIdentity id = new (claims);
			return new ClaimsPrincipal(id);
		}
	}
}