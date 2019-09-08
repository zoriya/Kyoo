namespace Kyoo.InternalAPI
{
    public interface ITranscoder
    {
        //Should transcode to a mp4 container (same video/audio format if possible, no subtitles).
        string Stream(string path);

        //Should transcode to a mp4 container with a h264 video format and a AAC audio format, no subtitles.
        string Transcode(string path);

        void GetVideo(string Path);

        dynamic ScanVideo(string Path);
    }
}
