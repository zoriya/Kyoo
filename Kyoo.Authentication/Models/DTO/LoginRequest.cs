namespace Kyoo.Authentication.Models.DTO
{
	/// <summary>
	/// A model only used on login requests.
	/// </summary>
	public class LoginRequest
	{
		/// <summary>
		/// The user's username.
		/// </summary>
		public string Username { get; set; }
		
		/// <summary>
		/// The user's password.
		/// </summary>
		public string Password { get; set; }
		
		/// <summary>
		/// Should the user stay logged in? If true a cookie will be put.
		/// </summary>
		public bool StayLoggedIn { get; set; }
		
		/// <summary>
		/// The return url of the login flow.
		/// </summary>
		public string ReturnURL { get; set; }
	}
}