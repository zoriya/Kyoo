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
		[EmailAddress]
		public string Email { get; set; }
		
		/// <summary>
		/// The new username of the user.
		/// </summary>
		[MinLength(4)]
		public string Username { get; set; }
		
		/// <summary>
		/// The picture icon.
		/// </summary>
		public IFormFile Picture { get; set; }
	}
}