using System.Globalization;
using System.Linq;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	/// <summary>
	/// The list of available stream types.
	/// Attachments are only used temporarily by the transcoder but are not stored in a database.
	/// </summary>
	public enum StreamType
	{
		Unknown = 0,
		Video = 1,
		Audio = 2,
		Subtitle = 3,
		Attachment = 4
	}

	/// <summary>
	/// A video, audio or subtitle track for an episode.
	/// </summary>
	public class Track : IResource
	{
		/// <inheritdoc />
		public int ID { get; set; }
		
		/// <inheritdoc />
		public string Slug
		{
			get
			{
				string type = Type switch
				{
					StreamType.Subtitle => "",
					StreamType.Video => "video.",
					StreamType.Audio => "audio.",
					StreamType.Attachment => "font.",
					_ => ""
				};
				string index = TrackIndex != 0 ? $"-{TrackIndex}" : string.Empty;
				string codec = Codec switch
				{
					"subrip" => ".srt",
					{} x => $".{x}"
				};
				return $"{Episode.Slug}.{type}{Language}{index}{(IsForced ? "-forced" : "")}{codec}";
			}
		}
		
		/// <summary>
		/// The title of the stream.
		/// </summary>
		public string Title { get; set; }
		
		/// <summary>
		/// The language of this stream (as a ISO-639-2 language code)
		/// </summary>
		public string Language { get; set; }
		
		/// <summary>
		/// The codec of this stream.
		/// </summary>
		public string Codec { get; set; }
		
		
		/// <summary>
		/// Is this stream the default one of it's type?
		/// </summary>
		public bool IsDefault { get; set; }
		
		/// <summary>
		/// Is this stream tagged as forced? 
		/// </summary>
		public bool IsForced { get; set; }
		
		/// <summary>
		/// Is this track extern to the episode's file?
		/// </summary>
		public bool IsExternal { get; set; }
		
		/// <summary>
		/// The path of this track.
		/// </summary>
		[SerializeIgnore] public string Path { get; set; }
		
		/// <summary>
		/// The type of this stream.
		/// </summary>
		[SerializeIgnore] public StreamType Type { get; set; }
		
		/// <summary>
		/// The ID of the episode that uses this track. This value is only set when the <see cref="Episode"/> has been loaded.
		/// </summary>
		[SerializeIgnore] public int EpisodeID { get; set; }
		/// <summary>
		/// The episode that uses this track.
		/// </summary>
		[LoadableRelation(nameof(EpisodeID))] public Episode Episode { get; set; }

		/// <summary>
		/// The index of this track on the episode.
		/// </summary>
		public int TrackIndex { get; set; }

		/// <summary>
		/// A user-friendly name for this track. It does not include the track type.
		/// </summary>
		public string DisplayName
		{
			get
			{
				string language = GetLanguage(Language);

				if (language == null)
					return $"Unknown (index: {TrackIndex})";
				CultureInfo info = CultureInfo.GetCultures(CultureTypes.NeutralCultures)
					.FirstOrDefault(x => x.ThreeLetterISOLanguageName == language);
				string name = info?.EnglishName ?? language;
				if (IsForced)
					name += " Forced";
				if (IsExternal)
					name += " (External)";
				if (Title is {Length: > 1})
					name += " - " + Title;
				return name;
			}
		}

		//Converting mkv track language to c# system language tag.
		private static string GetLanguage(string mkvLanguage)
		{
			// TODO delete this and have a real way to get the language string from the ISO-639-2.
			return mkvLanguage switch
			{
				"fre" => "fra",
				null => "und",
				_ => mkvLanguage
			};
		}
	}
}
