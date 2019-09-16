using Kyoo.InternalAPI.TranscoderLink;
using Kyoo.Models;
using Microsoft.Extensions.Configuration;
using System.Diagnostics;
using System.IO;

namespace Kyoo.InternalAPI
{
    public class Transcoder : ITranscoder
    {
        public Transcoder(IConfiguration config)
        {
            Debug.WriteLine("&Api INIT: " + TranscoderAPI.Init());
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

        public string Stream(string path)
        {
            return @"D:\Videos\Anohana\AnoHana S01E01.mp4";
        }

        public string Transcode(string path)
        {
            return @"D:\Videos\Anohana\AnoHana S01E01.mp4";
        }
    }
}
