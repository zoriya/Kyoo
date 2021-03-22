using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using Kyoo.Models;
using Microsoft.Extensions.Configuration;
using Stream = Kyoo.Models.Watch.Stream;

// We use threads so tasks are not always awaited.
#pragma warning disable 4014

namespace Kyoo.Controllers
{
	public class BadTranscoderException : Exception {}
	
	public class Transcoder : ITranscoder
	{
		private static class TranscoderAPI
		{
			private const string TranscoderPath = "libtranscoder.so";

			[DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
			public static extern int init();

			[DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
			public static extern int transmux(string path, string outpath, out float playableDuration);
		
			[DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
			public static extern int transcode(string path, string outpath, out float playableDuration);

			[DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
			private static extern IntPtr extract_infos(string path, 
				string outpath,
				out int length,
				out int trackCount,
				bool reextracct);
		
			[DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
			private static extern void free(IntPtr ptr);
		
		
			public static Track[] ExtractInfos(string path, string outPath, bool reextract)
			{
				int size = Marshal.SizeOf<Stream>();
				IntPtr ptr = extract_infos(path, outPath, out int arrayLength, out int trackCount, reextract);
				IntPtr streamsPtr = ptr;
				Track[] tracks;
			
				if (trackCount > 0 && ptr != IntPtr.Zero)
				{
					tracks = new Track[trackCount];

					int j = 0;
					for (int i = 0; i < arrayLength; i++)
					{
						Stream stream = Marshal.PtrToStructure<Stream>(streamsPtr);
						if (stream!.Type != StreamType.Unknown)
						{
							tracks[j] = new Track(stream);
							j++;
						}
						streamsPtr += size;
					}
				}
				else
					tracks = Array.Empty<Track>();

				if (ptr != IntPtr.Zero)
					free(ptr); // free_streams is not necesarry since the Marshal free the unmanaged pointers.
				return tracks;
			}
		}
		
		private readonly string _transmuxPath;
		private readonly string _transcodePath;

		public Transcoder(IConfiguration config)
		{
			_transmuxPath = Path.GetFullPath(config.GetValue<string>("transmuxTempPath"));
			_transcodePath = Path.GetFullPath(config.GetValue<string>("transcodeTempPath"));

			if (TranscoderAPI.init() != Marshal.SizeOf<Stream>())
				throw new BadTranscoderException();
		}

		public Task<Track[]> ExtractInfos(string path, bool reextract)
		{
			string dir = Path.GetDirectoryName(path);
			if (dir == null)
				throw new ArgumentException("Invalid path.");
			dir = Path.Combine(dir, "Extra");
			return Task.Factory.StartNew(
				() => TranscoderAPI.ExtractInfos(path, dir, reextract),
				TaskCreationOptions.LongRunning);
		}

		public async Task<string> Transmux(Episode episode)
		{
			if (!File.Exists(episode.Path))
				throw new ArgumentException("Path does not exists. Can't transcode.");
			
			string folder = Path.Combine(_transmuxPath, episode.Slug);
			string manifest = Path.Combine(folder, episode.Slug + ".m3u8");
			float playableDuration = 0;
			bool transmuxFailed = false;

			try
			{
				Directory.CreateDirectory(folder);
				if (File.Exists(manifest))
					return manifest;
			}
			catch (UnauthorizedAccessException)
			{
				await Console.Error.WriteLineAsync($"Access to the path {manifest} is denied. Please change your transmux path in the config.");
				return null;
			}
			
			Task.Factory.StartNew(() =>
			{
				string cleanManifest = manifest.Replace('\\', '/');
				transmuxFailed = TranscoderAPI.transmux(episode.Path, cleanManifest, out playableDuration) != 0;
			}, TaskCreationOptions.LongRunning);
			while (playableDuration < 10 || !File.Exists(manifest) && !transmuxFailed)
				await Task.Delay(10);
			return transmuxFailed ? null : manifest;
		}

		public Task<string> Transcode(Episode episode)
		{
			return Task.FromResult<string>(null); // Not implemented yet.
		}
	}
}
