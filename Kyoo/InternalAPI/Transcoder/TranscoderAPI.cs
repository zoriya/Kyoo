using System;
using System.Runtime.InteropServices;
using Kyoo.Models;
using Kyoo.Models.Watch;

namespace Kyoo.InternalAPI.TranscoderLink
{
    public class TranscoderAPI
    {
        private const string TranscoderPath = @"C:\Projects\Kyoo\Debug\Kyoo.Transcoder.dll";

        [DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
        public extern static int Init();

        [DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
        public extern static int Transmux(string path, string outPath);

        [DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
        [return:MarshalAs(UnmanagedType.LPArray, ArraySubType = UnmanagedType.LPStruct, SizeParamIndex = 3)]
        private extern static Stream[] ExtractSubtitles(string path, string outPath, out int arrayLength/*, out int trackCount*/);

        public static void ExtractSubtitles(string path, string outPath, out Track[] tracks)
        {
            //int size = Marshal.SizeOf<Stream>();

            Stream[] streamsPtr = ExtractSubtitles(path, outPath, out int count/*, out int trackCount*/);
            tracks = null;
            //if (trackCount > 0)
            //{
            //    tracks = new Track[trackCount];

            //    int j = 0;
            //    for (int i = 0; i < arrayLength; i++)
            //    {
            //        Stream stream = Marshal.PtrToStructure<Stream>(streamsPtr);
            //        if (stream.Codec != null) //If the codec is null, the stream doesn't represent a subtitle.
            //        {
            //            tracks[j] = Track.From(stream, StreamType.Subtitle);
            //            j++;
            //        }
            //        streamsPtr += size;
            //    }
            //}
            //else
            //    tracks = null;
        }
    }
}
