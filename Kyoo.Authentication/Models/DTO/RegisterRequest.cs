using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Kyoo.Abstractions.Models;
using Kyoo.Utils;

namespace Kyoo.Authentication.Models.DTO
{
	/// <summary>
	/// A model only used on register requests.
	/// </summary>
	public class RegisterRequest
	{
		/// <summary>
		/// The user email address
		/// </summary>
		[EmailAddress(ErrorMessage = "The email must be a valid email address")]
		public string Email { get; set; }

		/// <summary>
		/// The user's username.
		/// </summary>
		[MinLength(4, ErrorMessage = "The username must have at least {1} characters")]
		public string Username { get; set; }

		/// <summary>
		/// The user's password.
		/// </summary>
		[MinLength(8, ErrorMessage = "The password must have at least {1} characters")]
		public string Password { get; set; }

		/// <summary>
		/// Convert this register request to a new <see cref="User"/> class.
		/// </summary>
		/// <returns></returns>
		public User ToUser()
		{
			return new User
			{
				Slug = Utility.ToSlug(Username),
				Username = Username,
				Password = Password,
				Email = Email,
				ExtraData = new Dictionary<string, string>()
			};
		}
	}
}
