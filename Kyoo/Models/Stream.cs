using Newtonsoft.Json;
using System.Runtime.InteropServices;

namespace Kyoo.Models.Watch
{
    public enum StreamType
    {
        Audio, Subtitle, Unknow
    }

    [StructLayout(LayoutKind.Sequential)]
    public class Stream
    {
        public string Title;
        public string Language;
        public string Format;
        public bool IsDefault;
        public bool IsForced;
        [JsonIgnore] public string Path;

        //[JsonIgnore] public StreamType type;
        //[JsonIgnore] public bool IsExternal;

        //public Stream(StreamType type, string title, string language, bool isDefault, bool isForced, string format, bool isExternal, string path)
        //{
        //    this.type = type;
        //    Title = title;
        //    Language = language;
        //    IsDefault = isDefault;
        //    IsForced = isForced;
        //    Format = format;
        //    IsExternal = isExternal;
        //    Path = path;
        //}

        public static Stream FromReader(System.Data.SQLite.SQLiteDataReader reader)
        {
            return new Stream();
            //return new Stream(reader["streamType"] as StreamType? ?? StreamType.Unknow,
            //    reader["title"] as string,
            //    reader["language"] as string,
            //    reader["isDefault"] as bool? ?? false,
            //    reader["isForced"] as bool? ?? false,
            //    reader["codec"] as string,
            //    reader["isExternal"] as bool? ?? false,
            //    reader["path"] as string);
        }
    }
}
