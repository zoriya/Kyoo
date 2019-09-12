using Kyoo.InternalAPI.TranscoderLink;
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

        public void ExtractSubtitles(string path)
        {
            string output = Path.GetDirectoryName(path);
            output = Path.Combine(output, "fre\\output.ass");
            TranscoderAPI.ExtractSubtitles(path, output);
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
