namespace Kyoo.Authentication.Models
{
	/// <summary>
	/// The main authentication options.
	/// </summary>
	public class AuthenticationOption
	{
		/// <summary>
		/// The path to get this option from the root configuration.
		/// </summary>
		public const string Path = "authentication";

		/// <summary>
		/// The options for certificates
		/// </summary>
		public CertificateOption Certificate { get; set; }
		
		/// <summary>
		/// Options for permissions
		/// </summary>
		public PermissionOption Permissions { get; set; }
		
		/// <summary>
		/// Root path of user's profile pictures. 
		/// </summary>
		public string ProfilePicturePath { get; set; }
	}
}