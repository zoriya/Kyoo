using System.Runtime.InteropServices;

namespace Kyoo.InternalAPI.TranscoderLink
{
    public class TranscoderAPI
    {
        private const string TranscoderPath = @"C:\Projects\Kyoo\Debug\Kyoo.Transcoder.dll";

        [DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
        public extern static string Init();

        [DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
        public extern static string ExtractSubtitles(string path);
    }
}
