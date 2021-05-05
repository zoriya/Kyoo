using System.ComponentModel.DataAnnotations;
using Kyoo.Models;

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
		[EmailAddress]
		public string Email { get; set; }
		
		/// <summary>
		/// The user's username. 
		/// </summary>
		[MinLength(4)]
		public string Username { get; set; }
		
		/// <summary>
		/// The user's password.
		/// </summary>
		[MinLength(8)]
		public string Password { get; set; }


		/// <summary>
		/// Convert this register request to a new <see cref="User"/> class.
		/// </summary>
		/// <returns></returns>
		public User ToUser()
		{
			return new()
			{
				Slug = Utility.ToSlug(Username),
				Username = Username,
				Password = Password,
				Email = Email
			};
		}
	}	
}