using Kyoo.Models;
using Kyoo.Models.Watch;
using System.Threading.Tasks;

namespace Kyoo.InternalAPI
{
    public interface ITranscoder
    {
        //Should transcode to a mp4 container (same video/audio format if possible, no subtitles).
        string Transmux(WatchItem episode);

        //Should transcode to a mp4 container with a h264 video format and a AAC audio format, no subtitles.
        string Transcode(string path);

        //Extract all subtitles of a video and save them in the subtitles sub-folder.
        Task<Track[]> ExtractSubtitles(string path);
    }
}
