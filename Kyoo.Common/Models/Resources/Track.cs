using Kyoo.Models.Watch;
using System.Globalization;
using System.Linq;
using System.Runtime.InteropServices;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	public enum StreamType
	{
		Unknown = 0,
		Video = 1,
		Audio = 2,
		Subtitle = 3,
		Font = 4
	}

	namespace Watch
	{
		[StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
		public class Stream
		{
			public string Title { get; set; }
			public string Language { get; set; }
			public string Codec { get; set; }
			[MarshalAs(UnmanagedType.I1)] public bool isDefault;
			[MarshalAs(UnmanagedType.I1)] public bool isForced;
			[SerializeIgnore] public string Path { get; set; }
			[SerializeIgnore] public StreamType Type { get; set; }
			
			public Stream() {}
			
			public Stream(string title, string language, string codec, bool isDefault, bool isForced, string path, StreamType type)
			{
				Title = title;
				Language = language;
				Codec = codec;
				this.isDefault = isDefault;
				this.isForced = isForced;
				Path = path;
				Type = type;
			}
			
			public Stream(Stream stream)
			{
				Title  = stream.Title;
				Language  = stream.Language;
				isDefault  = stream.isDefault;
				isForced  = stream.isForced;
				Codec  = stream.Codec;
				Path = stream.Path;
				Type  = stream.Type;
			}
		}
	}

	public class Track : Stream, IResource
	{
		public int ID { get; set; }
		[SerializeIgnore] public int EpisodeID { get; set; }
		public bool IsDefault
		{
			get => isDefault;
			set => isDefault = value;
		}
		public bool IsForced
		{
			get => isForced;
			set => isForced = value;
		}

		public string DisplayName
		{
			get
			{
				string language = GetLanguage(Language);

				if (language == null)
					return $"Unknown Language (id: {ID.ToString()})";
				CultureInfo info = CultureInfo.GetCultures(CultureTypes.NeutralCultures)
					.FirstOrDefault(x => x.ThreeLetterISOLanguageName == language);
				string name = info?.EnglishName ?? language;
				if (IsForced)
					name += " Forced";
				if (IsExternal)
					name += " (External)";
				if (Title != null && Title.Length > 1)
					name += " - " + Title;
				return name;
			}
		}

		public string Slug
		{
			get
			{
				if (Type != StreamType.Subtitle)
					return null;

				string slug = string.IsNullOrEmpty(Language) 
					? ID.ToString()
					: $"{Episode.Slug}.{Language}{(IsForced ? "-forced" : "")}";
				switch (Codec)
				{
					case "ass":
						slug += ".ass";
						break;
					case "subrip":
						slug += ".srt";
						break;
				}
				return slug;
			}
		}

		public bool IsExternal { get; set; }
		[LoadableRelation(nameof(EpisodeID))] public virtual Episode Episode { get; set; }
		
		public Track() { }

		public Track(StreamType type, 
			string title, 
			string language, 
			bool isDefault,
			bool isForced,
			string codec, 
			bool isExternal, 
			string path)
			: base(title, language, codec, isDefault, isForced, path, type)
		{
			IsExternal = isExternal;
		}

		public Track(Stream stream)
			: base(stream)
		{
			IsExternal = false;
		}

		//Converting mkv track language to c# system language tag.
		private static string GetLanguage(string mkvLanguage)
		{
			return mkvLanguage switch
			{
				"fre" => "fra",
				_ => mkvLanguage
			};
		}
	}
}
