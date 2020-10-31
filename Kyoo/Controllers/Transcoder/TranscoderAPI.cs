using System;
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
		private static extern IntPtr extract_infos(string path, string outpath, out int length, out int track_count);
		
		[DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
		private static extern void free(IntPtr stream_ptr);
		
		
		public static Track[] ExtractInfos(string path, string outPath)
		{
			int size = Marshal.SizeOf<Stream>();
			IntPtr ptr = extract_infos(path, outPath, out int arrayLength, out int trackCount);
			IntPtr streamsPtr = ptr;
			Track[] tracks;
			
			if (trackCount > 0 && ptr != IntPtr.Zero)
			{
				tracks = new Track[trackCount];

				int j = 0;
				for (int i = 0; i < arrayLength; i++)
				{
					Stream stream = Marshal.PtrToStructure<Stream>(streamsPtr);
					if (stream!.Type != StreamType.Unknow)
					{
						tracks[j] = new Track(stream);
						j++;
					}
					streamsPtr += size;
				}
			}
			else
				tracks = new Track[0];

			if (ptr != IntPtr.Zero)
				free(ptr); // free_streams is not necesarry since the Marshal free the unmanaged pointers.
			return tracks;
		}
	}
}
