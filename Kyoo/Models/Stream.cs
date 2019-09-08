using Newtonsoft.Json;

namespace Kyoo.Models.Watch
{
    public enum StreamType
    {
        Audio, Subtitle, Unknow
    }

    public class Stream
    {
        [JsonIgnore] public StreamType type;
        public string Title;
        public string Language;
        public bool IsDefault;
        public bool IsForced;
        public string Format;

        [JsonIgnore] public bool IsExternal;
        [JsonIgnore] public string Path;

        public Stream(StreamType type, string title, string language, bool isDefault, bool isForced, string format, bool isExternal, string path)
        {
            this.type = type;
            Title = title;
            Language = language;
            IsDefault = isDefault;
            IsForced = isForced;
            Format = format;
            IsExternal = isExternal;
            Path = path;
        }

        public static Stream FromReader(System.Data.SQLite.SQLiteDataReader reader)
        {
            return new Stream(reader["streamType"] as StreamType? ?? StreamType.Unknow,
                reader["title"] as string,
                reader["language"] as string,
                reader["isDefault"] as bool? ?? false,
                reader["isForced"] as bool? ?? false,
                reader["codec"] as string,
                reader["isExternal"] as bool? ?? false,
                reader["path"] as string);
        }
    }
}
