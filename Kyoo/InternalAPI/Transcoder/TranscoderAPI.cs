using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using Kyoo.Models;
using Kyoo.Models.Watch;

namespace Kyoo.InternalAPI.TranscoderLink
{
    public class TranscoderAPI
    {
        private const string TranscoderPath = @"Transcoder\Kyoo.Transcoder.dll";

        [DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
        public extern static int Init();

        [DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
        public extern static int Transmux(string path, string outPath);

        [DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
        private extern static IntPtr ExtractSubtitles(string path, string outPath, out int arrayLength, out int trackCount);

        [DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
        private extern static void FreeMemory(IntPtr streamsPtr);

        public static void ExtractSubtitles(string path, string outPath, out Track[] tracks)
        {
            int size = Marshal.SizeOf<Stream>();

            IntPtr ptr = ExtractSubtitles(path, outPath, out int arrayLength, out int trackCount);
            IntPtr streamsPtr = ptr;
            if (trackCount > 0 && ptr != IntPtr.Zero)
            {
                tracks = new Track[trackCount];

                int j = 0;
                for (int i = 0; i < arrayLength; i++)
                {
                    Stream stream = Marshal.PtrToStructure<Stream>(streamsPtr);
                    if (stream.Codec != null) //If the codec is null, the stream doesn't represent a subtitle.
                    {
                        tracks[j] = Track.From(stream, StreamType.Subtitle);
                        j++;
                    }
                    streamsPtr += size;
                }
            }
            else
                tracks = null;

            FreeMemory(ptr);
            Debug.WriteLine("&" + tracks?.Length + " tracks got at: " + path);
        }

        [DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
        private extern static IntPtr TestMemory(string path, string outPath, out int arrayLength, out int trackCount);

    }
}
