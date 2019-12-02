using Kyoo.InternalAPI.TranscoderLink;
using Kyoo.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading.Tasks;

namespace Kyoo.InternalAPI
{
    public class Transcoder : ITranscoder
    {
        private readonly string transmuxPath;

        public Transcoder(IConfiguration config)
        {
            transmuxPath = config.GetValue<string>("transmuxTempPath");

            Debug.WriteLine("&Api INIT (unmanaged stream size): " + TranscoderAPI.Init() + ", Stream size: " + Marshal.SizeOf<Models.Watch.Stream>());
        }

        public async Task<Track[]> GetTrackInfo(string path)
        {
            return await Task.Run(() =>
            {
                TranscoderAPI.GetTrackInfo(path, out Track[] tracks);
                return tracks;
            });
        }

        public async Task<Track[]> ExtractSubtitles(string path)
        {
            string output = Path.Combine(Path.GetDirectoryName(path), "Subtitles");
            Directory.CreateDirectory(output);
            return await Task.Run(() => 
            { 
                TranscoderAPI.ExtractSubtitles(path, output, out Track[] tracks);
                return tracks;
            });
        }

        public async Task<string> Transmux(WatchItem episode)
        {
            string folder = Path.Combine(transmuxPath, episode.Link);
            string manifest = Path.Combine(folder, episode.Link + ".m3u8");
            float playableDuration = 0;
            bool transmuxFailed = false;

            Directory.CreateDirectory(folder);
            Debug.WriteLine("&Transmuxing " + episode.Link + " at " + episode.Path + ", outputPath: " + folder);

            if (File.Exists(manifest))
                return manifest;
            // Added an await and removed the while -> await because the dynamic dash file can't be played for now (maybe ffmpeg doesn't process in the playback order).
            /*await */Task.Run(() => 
            { 
                transmuxFailed = TranscoderAPI.transmux(episode.Path, manifest.Replace('\\', '/'), out playableDuration) != 0;
                //playableDuration = float.MaxValue;
            });
            while (playableDuration < 20 || (!File.Exists(manifest) && !transmuxFailed))
                await Task.Delay(10);
            return transmuxFailed ? null : manifest;
        }

        public Task<string> Transcode(WatchItem episode)
        {
            //NOT IMPLEMENTED YET
            return null;
        }
    }
}
