namespace Kyoo.Authentication.Models
{
	/// <summary>
	/// A typed option model for the certificate
	/// </summary>
	public class CertificateOption
	{
		/// <summary>
		/// The path to get this option from the root configuration.
		/// </summary>
		public const string Path = "authentication:certificate";
		
		/// <summary>
		/// The path of the certificate file.
		/// </summary>
		public string File { get; set; }
		/// <summary>
		/// The path of the old certificate file.
		/// </summary>
		public string OldFile { get; set; }
		/// <summary>
		/// The password of the certificates.
		/// </summary>
		public string Password { get; set; }
	}
}