using Kyoo.Models;
using Kyoo.Models.Watch;
using System.Threading.Tasks;

namespace Kyoo.Controllers
{
    public interface ITranscoder
    {
        // Should transcode to a mp4 container (same video/audio format if possible, no subtitles).
        Task<string> Transmux(WatchItem episode);

        // Should transcode to a mp4 container with a h264 video format and a AAC audio format, no subtitles.
        Task<string> Transcode(WatchItem episode);

        // Get video and audio tracks infos (codec, name, language...)
        Task<Track[]> GetTrackInfo(string path);

        // Extract all subtitles of a video and save them in the subtitles sub-folder.
        Task<Track[]> ExtractSubtitles(string path);
    }
}
