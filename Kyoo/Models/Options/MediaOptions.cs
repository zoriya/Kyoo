namespace Kyoo.Models.Options
{
	/// <summary>
	/// Options for media registering.
	/// </summary>
	public class MediaOptions
	{
		/// <summary>
		/// The path of this options
		/// </summary>
		public const string Path = "Media";
		
		/// <summary>
		/// A regex for episodes
		/// </summary>
		public string Regex { get; set; }
		
		/// <summary>
		/// A regex for subtitles
		/// </summary>
		public string SubtitleRegex { get; set; }
	}
}