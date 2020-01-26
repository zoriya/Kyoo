using System;
using System.Diagnostics;
using System.Linq;
using System.Runtime.InteropServices;
using Kyoo.Models;
using Kyoo.Models.Watch;
// ReSharper disable InconsistentNaming

namespace Kyoo.Controllers.TranscoderLink
{
    public static class TranscoderAPI
    {
        private const string TranscoderPath = "libtranscoder.so";

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
        
        [DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
        private static extern void free(IntPtr ptr);


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
                        tracks[j] = new Track(stream);
                        j++;
                    }
                    streamsPtr += size;
                }
            }
            else
                tracks = new Track[0];

            free(ptr);
            Console.WriteLine($"\t{tracks.Length} tracks got at: {path}");
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
                        tracks[j] = new Track(stream);
                        j++;
                    }
                    streamsPtr += size;
                }
            }
            else
                tracks = new Track[0];

            free(ptr);
            Console.WriteLine($"\t{tracks.Count(x => x.Type == StreamType.Subtitle)} subtitles got at: {path}");
        }
    }
}
