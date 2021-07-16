using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace Kyoo.Models.Watch
{
	public static class FileExtensions
	{
		public static readonly string[] VideoExtensions =
		{
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
		};

		public static bool IsVideo(string filePath)
		{
			return VideoExtensions.Contains(Path.GetExtension(filePath));
		}
		
		public static readonly Dictionary<string, string> SubtitleExtensions = new()
		{
			{".ass", "ass"},
			{".str", "subrip"}
		};

		public static bool IsSubtitle(string filePath)
		{
			return SubtitleExtensions.ContainsKey(Path.GetExtension(filePath));
		}
	}
}