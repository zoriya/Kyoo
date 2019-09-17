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
            Audio, Subtitle, Unknow
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
        }
    }

    public class Track : Stream
    {
        public string DisplayName;
        [JsonIgnore] public readonly long id;
        [JsonIgnore] public long episodeID;
        [JsonIgnore] public StreamType type;
        [JsonIgnore] public bool IsExternal;

        public Track(StreamType type, string title, string language, bool isDefault, bool isForced, string codec, bool isExternal, string path)
        {
            this.type = type;
            Title = title;
            Language = language;
            IsDefault = isDefault;
            IsForced = isForced;
            Codec = codec;
            IsExternal = isExternal;
            Path = path;

            //Converting mkv track language to c# system language tag.
            if (language == "fre")
                language = "fra";

            DisplayName = CultureInfo.GetCultures(CultureTypes.NeutralCultures).Where(x => x.ThreeLetterISOLanguageName == language).FirstOrDefault()?.DisplayName ?? language;
            if (Title != null && Title.Length > 1)
                DisplayName += " - " + Title;
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

        public static Track From(Stream stream)
        {
            return new Track(StreamType.Unknow, stream.Title, stream.Language, stream.IsDefault, stream.IsForced, stream.Codec, false, stream.Path);
        }

        public static Track From(Stream stream, StreamType type)
        {
            return new Track(type, stream.Title, stream.Language, stream.IsDefault, stream.IsForced, stream.Codec, false, stream.Path);
        }
    }
}