namespace Kyoo.Authentication.Models.DTO
{
	/// <summary>
	/// A model to represent an otac request
	/// </summary>
	public class OtacRequest
	{
		/// <summary>
		/// The One Time Access Code
		/// </summary>
		public string Otac { get; set; }
		
		/// <summary>
		/// Should the user stay logged
		/// </summary>
		public bool StayLoggedIn { get; set; }
	}
}