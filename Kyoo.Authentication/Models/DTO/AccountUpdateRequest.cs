using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace Kyoo.Authentication.Models.DTO
{
	/// <summary>
	/// A model only used on account update requests.
	/// </summary>
	public class AccountUpdateRequest
	{
		/// <summary>
		/// The new email address of the user
		/// </summary>
		[EmailAddress(ErrorMessage = "The email is invalid.")]
		public string Email { get; set; }
		
		/// <summary>
		/// The new username of the user.
		/// </summary>
		[MinLength(4, ErrorMessage = "The username must have at least 4 characters")]
		public string Username { get; set; }
		
		/// <summary>
		/// The picture icon.
		/// </summary>
		public IFormFile Picture { get; set; }
	}
}