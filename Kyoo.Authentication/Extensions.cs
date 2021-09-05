using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using IdentityModel;
using IdentityServer4;
using Kyoo.Abstractions.Models;

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
		/// Convert a user to an <see cref="IdentityServerUser"/>.
		/// </summary>
		/// <param name="user">The user to convert</param>
		/// <returns>The corresponding identity server user.</returns>
		public static IdentityServerUser ToIdentityUser(this User user)
		{
			return new(user.ID.ToString())
			{
				DisplayName = user.Username,
				AdditionalClaims = new[] { new Claim("permissions", string.Join(',', user.Permissions)) }
			};
		}

		/// <summary>
		/// Get the permissions of an user.
		/// </summary>
		/// <param name="user">The user</param>
		/// <returns>The list of permissions</returns>
		public static ICollection<string> GetPermissions(this ClaimsPrincipal user)
		{
			return user.Claims.FirstOrDefault(x => x.Type == "permissions")?.Value.Split(',');
		}
	}
}
