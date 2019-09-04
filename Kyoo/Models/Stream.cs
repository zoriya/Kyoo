namespace Kyoo.Models.Watch
{
    public struct Stream
    {
        public string Title;
        public string Language;
        public bool IsDefault;
        public bool IsForced;
        public string Format;
    }

    public struct VideoStream
    {
        public string Title;
        public string Language;
    }
}
