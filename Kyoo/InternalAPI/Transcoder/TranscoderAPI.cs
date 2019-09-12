using System.Runtime.InteropServices;

namespace Kyoo.InternalAPI.TranscoderLink
{
    public class TranscoderAPI
    {
        private const string TranscoderPath = @"C:\Projects\Kyoo\Debug\Kyoo.Transcoder.dll";

        [DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
        public extern static int Init();

        [DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
        public extern static void ExtractSubtitles(string path, string outPath);
    }
}
