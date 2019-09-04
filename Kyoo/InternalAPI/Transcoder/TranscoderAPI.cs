using System.Runtime.InteropServices;

namespace Kyoo.InternalAPI.TranscoderLink
{
    public class TranscoderAPI
    {
        [DllImport(@"C:\Projects\Kyoo\Debug\Kyoo.Transcoder.dll", CallingConvention = CallingConvention.Cdecl)]
        public extern static int Init();
    }
}
