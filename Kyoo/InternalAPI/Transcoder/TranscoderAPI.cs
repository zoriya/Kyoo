using System;
using System.Runtime.InteropServices;
using Kyoo.Models.Watch;

namespace Kyoo.InternalAPI.TranscoderLink
{
    public class TranscoderAPI
    {
        private const string TranscoderPath = @"C:\Projects\Kyoo\Debug\Kyoo.Transcoder.dll";

        [DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
        public extern static int Init();

        [DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
        private extern static IntPtr ExtractSubtitles(string path, string outPath, out int streams);

        public static void ExtractSubtitles(string path, string outPath, out Stream[] streams)
        {
            int size = Marshal.SizeOf<Stream>();

            IntPtr streamsPtr = ExtractSubtitles(path, outPath, out int length);
            if (length > 0)
            {
                streams = new Stream[length];

                for (int i = 0; i < length; i++)
                {
                    streams[i] = Marshal.PtrToStructure<Stream>(streamsPtr);
                    streamsPtr += size;
                }
            }
            else
                streams = null;
        }
    }
}
