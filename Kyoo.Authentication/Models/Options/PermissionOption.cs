namespace Kyoo.Authentication.Models
{
	/// <summary>
	/// Permission options.
	/// </summary>
	public class PermissionOption
	{
		/// <summary>
		/// The path to get this option from the root configuration.
		/// </summary>
		public const string Path = "authentication:permissions";

		/// <summary>
		/// The default permissions that will be given to a non-connected user.
		/// </summary>
		public string[] Default { get; set; }

		/// <summary>
		/// Permissions applied to a new user.
		/// </summary>
		public string[] NewUser { get; set; }
	}
}
