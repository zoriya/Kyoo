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
		/// <summary>
		/// Get claims of an user.
		/// </summary>
		/// <param name="user">The user concerned</param>
		/// <returns>The list of claims the user has</returns>
		public static ICollection<Claim> GetClaims(this User user)
		{
			return new[]
			{
				new Claim(JwtClaimTypes.Subject, user.ID.ToString()),
				new Claim(JwtClaimTypes.Name, user.Username),
				new Claim(JwtClaimTypes.Picture, $"api/account/picture/{user.Slug}")
			};
		}
		
		/// <summary>
		/// Convert a user to a ClaimsPrincipal.
		/// </summary>
		/// <param name="user">The user to convert</param>
		/// <returns>A ClaimsPrincipal representing the user</returns>
		public static ClaimsPrincipal ToPrincipal(this User user)
		{
			ClaimsIdentity id = new (user.GetClaims());
			return new ClaimsPrincipal(id);
		}
	}
}