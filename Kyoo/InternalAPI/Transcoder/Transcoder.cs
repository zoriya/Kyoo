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
        private readonly string tempPath;

        public Transcoder(IConfiguration config)
        {
            tempPath = config.GetValue<string>("tempPath");

            Debug.WriteLine("&Api INIT (unmanaged stream size): " + TranscoderAPI.Init() + ", Stream size: " + Marshal.SizeOf<Models.Watch.Stream>());
        }

        public Track[] ExtractSubtitles(string path)
        {
            string output = Path.Combine(Path.GetDirectoryName(path), "Subtitles");
            Directory.CreateDirectory(output);
            TranscoderAPI.ExtractSubtitles(path, output, out Track[] tracks);

            return tracks;
        }

        public void GetVideo(string path)
        {
            Debug.WriteLine("&Getting video...");
        }

        public string Transmux(WatchItem episode)
        {
            string temp = Path.Combine(tempPath, episode.Link + ".mp4");
            Debug.WriteLine("&Transmuxing " + episode.Link + " at " + episode.Path + ", outputPath: " + temp);
            if (File.Exists(temp) || TranscoderAPI.Transmux(episode.Path, temp) == 0)
                return temp;
            else
                return null;
        }

        public string Transcode(string path)
        {
            return @"D:\Videos\Anohana\AnoHana S01E01.mp4";
        }
    }
}
