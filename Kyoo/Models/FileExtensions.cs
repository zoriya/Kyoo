using System.Collections.Generic;
using System.Collections.Immutable;
using System.IO;

namespace Kyoo.Models.Watch
{
	/// <summary>
	/// A static class allowing one to identify files extensions.
	/// </summary>
	public static class FileExtensions
	{
		/// <summary>
		/// The list of known video extensions
		/// </summary>
		public static readonly ImmutableArray<string> VideoExtensions = ImmutableArray.Create(
			".webm",
			".mkv",
			".flv",
			".vob",
			".ogg", 
			".ogv",
			".avi",
			".mts",
			".m2ts",
			".ts",
			".mov",
			".qt",
			".asf", 
			".mp4",
			".m4p",
			".m4v",
			".mpg",
			".mp2",
			".mpeg",
			".mpe",
			".mpv",
			".m2v",
			".3gp",
			".3g2"
		);

		/// <summary>
		/// Check if a file represent a video file (only by checking the extension of the file)
		/// </summary>
		/// <param name="filePath">The path of the file to check</param>
		/// <returns><c>true</c> if the file is a video file, <c>false</c> otherwise.</returns>
		public static bool IsVideo(string filePath)
		{
			return VideoExtensions.Contains(Path.GetExtension(filePath));
		}
		
		/// <summary>
		/// The dictionary of known subtitles extensions and the name of the subtitle codec.
		/// </summary>
		public static readonly ImmutableDictionary<string, string> SubtitleExtensions =  new Dictionary<string, string> 
		{
			{".ass", "ass"},
			{".str", "subrip"}
		}.ToImmutableDictionary();

		/// <summary>
		/// Check if a file represent a subtitle  file (only by checking the extension of the file)
		/// </summary>
		/// <param name="filePath">The path of the file to check</param>
		/// <returns><c>true</c> if the file is a subtitle file, <c>false</c> otherwise.</returns>
		public static bool IsSubtitle(string filePath)
		{
			return SubtitleExtensions.ContainsKey(Path.GetExtension(filePath));
		}
	}
}