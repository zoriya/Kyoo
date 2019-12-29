using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using Kyoo.Models;
using Kyoo.Models.Watch;
// ReSharper disable InconsistentNaming

namespace Kyoo.InternalAPI.TranscoderLink
{
    public static class TranscoderAPI
    {
        private const string TranscoderPath = @"/home/anonymus-raccoon/Projects/Kyoo/transcoder/cmake-build-debug/libtranscoder.so";

        [DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
        public static extern int init();

        [DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
        public static extern int transmux(string path, string out_path, out float playableDuration);
        
        [DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
        public static extern int transcode(string path, string out_path, out float playableDuration);

        [DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
        private static extern IntPtr get_track_info(string path, out int array_length, out int track_count);
        
        [DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
        private static extern IntPtr extract_subtitles(string path, string out_path, out int array_length, out int track_count);

        [DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
        private static extern void free_streams(IntPtr stream_ptr);


        public static void GetTrackInfo(string path, out Track[] tracks)
        {
            int size = Marshal.SizeOf<Stream>();
            IntPtr ptr = get_track_info(path, out int arrayLength, out int trackCount);
            IntPtr streamsPtr = ptr;

            if (trackCount > 0 && ptr != IntPtr.Zero)
            {
                tracks = new Track[trackCount];

                int j = 0;
                for (int i = 0; i < arrayLength; i++)
                {
                    Stream stream = Marshal.PtrToStructure<Stream>(streamsPtr);
                    if (stream.Type != StreamType.Unknow)
                    {
                        tracks[j] = (Track)stream;
                        j++;
                    }
                    streamsPtr += size;
                }
            }
            else
                tracks = null;

            free_streams(ptr);
            Debug.WriteLine("&" + tracks?.Length + " tracks got at: " + path);
        }

        public static void ExtractSubtitles(string path, string outPath, out Track[] tracks)
        {
            int size = Marshal.SizeOf<Stream>();
            IntPtr ptr = extract_subtitles(path, outPath, out int arrayLength, out int trackCount);
            IntPtr streamsPtr = ptr;

            if (trackCount > 0 && ptr != IntPtr.Zero)
            {
                tracks = new Track[trackCount];

                int j = 0;
                for (int i = 0; i < arrayLength; i++)
                {
                    Stream stream = Marshal.PtrToStructure<Stream>(streamsPtr);
                    if (stream.Type != StreamType.Unknow)
                    {
                        tracks[j] = (Track)stream;
                        j++;
                    }
                    streamsPtr += size;
                }
            }
            else
                tracks = null;

            free_streams(ptr);
            Debug.WriteLine("&" + tracks?.Length + " tracks got at: " + path);
        }
    }
}
