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
            public string Title;
            public string Language;
            public string Codec;
            [MarshalAs(UnmanagedType.I1)] public bool IsDefault;
            [MarshalAs(UnmanagedType.I1)] public bool IsForced;
            [JsonIgnore] public string Path;
            [JsonIgnore] public StreamType Type;
            
            public Stream() {}
            
            public Stream(string title, string language, string codec, bool isDefault, bool isForced, string path, StreamType type)
            {
                Title = title;
                Language = language;
                Codec = codec;
                IsDefault = isDefault;
                IsForced = isForced;
                Path = path;
                Type = type;
            }
            
            public Stream(Stream stream)
            {
                Title  = stream.Title;
                Language  = stream.Language;
                IsDefault  = stream.IsDefault;
                IsForced  = stream.IsForced;
                Codec  = stream.Codec;
                Path = stream.Path;
                Type  = stream.Type;
            }
        }
    }

    public class Track : Stream
    {
        public string DisplayName;
        public string Link;

        [JsonIgnore] public long EpisodeID;
        [JsonIgnore] public bool IsExternal;

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

        public static Track FromReader(System.Data.SQLite.SQLiteDataReader reader)
        {
            return new Track((StreamType)Enum.ToObject(typeof(StreamType), reader["streamType"]),
                reader["title"] as string,
                reader["language"] as string,
                reader["isDefault"] as bool? ?? false,
                reader["isForced"] as bool? ?? false,
                reader["codec"] as string,
                reader["isExternal"] as bool? ?? false,
                reader["path"] as string);
        }

        public Track SetLink(string episodeSlug)
        {
            if (Type == StreamType.Subtitle)
            {
                string language = Language;
                //Converting mkv track language to c# system language tag.
                if (language == "fre")
                    language = "fra";

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