namespace Kyoo.TheTvdb.Models
{
	/// <summary>
	/// The option containing the api key for the tvdb.
	/// </summary>
	public class TvdbOption
	{
		/// <summary>
		/// The path to get this option from the root configuration.
		/// </summary>
		public const string Path = "tvdb";

		/// <summary>
		/// The api key of the tvdb.
		/// </summary>
		public string ApiKey { get; set; }
	}
}
