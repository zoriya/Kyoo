using Kyoo.Models.Watch;
using Newtonsoft.Json;
using System;
using System.Globalization;
using System.Linq;
using System.Runtime.InteropServices;

namespace Kyoo.Models
{
	namespace Watch
	{
		public enum StreamType
		{
			Unknow = 0,
			Video = 1,
			Audio = 2,
			Subtitle = 3
		}

		[StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
		public class Stream
		{
			public string Title { get; set; }
			public string Language { get; set; }
			public string Codec { get; set; }
			[MarshalAs(UnmanagedType.I1)] public bool isDefault;
			[MarshalAs(UnmanagedType.I1)] public bool isForced;
			[JsonIgnore] public string Path { get; set; }
			[JsonIgnore] public StreamType Type { get; set; }
			
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

	public class Track : Stream
	{
		[JsonIgnore] public long ID { get; set; }
		[JsonIgnore] public long EpisodeID { get; set; }
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
		public string DisplayName;
		public string Link;

		[JsonIgnore] public bool IsExternal { get; set; }
		[JsonIgnore] public virtual Episode Episode { get; set; }
		
		public Track() { }

		public Track(StreamType type, string title, string language, bool isDefault, bool isForced, string codec, bool isExternal, string path)
			: base(title, language, codec, isDefault, isForced, path, type)
		{
			IsExternal = isExternal;
		}

		public Track(Stream stream)
			: base(stream)
		{
			IsExternal = false;
		}

		public Track SetLink(string episodeSlug)
		{
			if (Type == StreamType.Subtitle)
			{
				string language = Language;
				//Converting mkv track language to c# system language tag.
				if (language == "fre")
					language = "fra";
				
				if (language == null)
				{
					Language = ID.ToString();
					DisplayName = $"Unknown Language (id: {ID.ToString()})";
				}
				else
					DisplayName = CultureInfo.GetCultures(CultureTypes.NeutralCultures).FirstOrDefault(x => x.ThreeLetterISOLanguageName == language)?.EnglishName ?? language;
				Link = "/subtitle/" + episodeSlug + "." + Language;

				if (IsForced)
				{
					DisplayName += " Forced";
					Link += "-forced";
				}

				if (Title != null && Title.Length > 1)
					DisplayName += " - " + Title;

				switch (Codec)
				{
					case "ass":
						Link += ".ass";
						break;
					case "subrip":
						Link += ".srt";
						break;
				}
			}
			else
				Link = null;
			return this;
		}
	}
}