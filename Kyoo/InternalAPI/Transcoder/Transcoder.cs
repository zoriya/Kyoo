using Kyoo.InternalAPI.TranscoderLink;
using Microsoft.Extensions.Configuration;
using System.Diagnostics;

namespace Kyoo.InternalAPI
{
    public class Transcoder : ITranscoder
    {
        public Transcoder(IConfiguration config)
        {
            string transcoderPath = config.GetValue<string>("plugins");
            Debug.WriteLine("&Transcoder DLL Path: " + transcoderPath);
            Debug.WriteLine("&Api INIT: " + TranscoderAPI.Init());
        }

        public void GetVideo(string path)
        {
            Debug.WriteLine("&Getting video...");
        }

        public dynamic ScanVideo(string path)
        {
            return TranscoderAPI.ScanVideo(path);
        }
    }
}
