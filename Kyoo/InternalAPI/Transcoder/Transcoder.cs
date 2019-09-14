using Kyoo.InternalAPI.TranscoderLink;
using Microsoft.Extensions.Configuration;
using System.Diagnostics;
using System.IO;
using Stream = Kyoo.Models.Watch.Stream;

namespace Kyoo.InternalAPI
{
    public class Transcoder : ITranscoder
    {
        public Transcoder(IConfiguration config)
        {
            Debug.WriteLine("&Api INIT: " + TranscoderAPI.Init());
        }

        public Stream[] ExtractSubtitles(string path)
        {
            string output = Path.Combine(Path.GetDirectoryName(path), "Subtitles");
            Directory.CreateDirectory(output);
            TranscoderAPI.ExtractSubtitles(path, output, out Stream[] streams);

            return streams;
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
