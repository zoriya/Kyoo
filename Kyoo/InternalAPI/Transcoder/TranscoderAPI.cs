using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
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
        public extern static int transmux(string path, string out_path, out float playableDuration);

        [DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
        private extern static IntPtr get_track_info(string path, out int array_length, out int track_count);
        
        [DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
        private extern static IntPtr extract_subtitles(string path, string out_path, out int array_length, out int track_count);

        [DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
        private extern static void free_memory(IntPtr stream_ptr);


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
                    if (stream.Codec != null) //If the codec is null, the stream doesn't represent a usfull thing.
                    {
                        tracks[j] = Track.From(stream, stream.Title == "VIDEO" ? StreamType.Video : StreamType.Audio);
                        j++;
                    }
                    streamsPtr += size;
                }
            }
            else
                tracks = null;

            free_memory(ptr);
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

            free_memory(ptr);
            Debug.WriteLine("&" + tracks?.Length + " tracks got at: " + path);
        }
    }
}
