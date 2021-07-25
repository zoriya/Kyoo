namespace Kyoo.TheMovieDb.Models
{
	/// <summary>
	/// The option containing the api key for TheMovieDb.
	/// </summary>
	public class TheMovieDbOptions
	{
		/// <summary>
		/// The path to get this option from the root configuration.
		/// </summary>
		public const string Path = "the-moviedb";

		/// <summary>
		/// The api key of TheMovieDb. 
		/// </summary>
		public string ApiKey { get; set; }
	}
}