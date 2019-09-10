using Kyoo.InternalAPI.TranscoderLink;
using Microsoft.Extensions.Configuration;
using System.Diagnostics;

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
            Debug.WriteLine("&Transcoder extract subs: " + TranscoderAPI.ExtractSubtitles(path));
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
