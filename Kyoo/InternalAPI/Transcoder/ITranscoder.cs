namespace Kyoo.InternalAPI
{
    public interface ITranscoder
    {
        void GetVideo(string Path);

        dynamic ScanVideo(string Path);
    }
}
