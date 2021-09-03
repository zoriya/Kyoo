using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Core.Models.Options;
using Microsoft.Extensions.Options;
using Stream = Kyoo.Core.Models.Watch.Stream;

// We use threads so tasks are not always awaited.
#pragma warning disable 4014

namespace Kyoo.Core.Controllers
{
	public class BadTranscoderException : Exception { }

	public class Transcoder : ITranscoder
	{
		private static class TranscoderAPI
		{
			private const string TranscoderPath = "transcoder";

			[DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
			private static extern int init();

			public static int Init() => init();

			[DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl,
				CharSet = CharSet.Ansi, BestFitMapping = false, ThrowOnUnmappableChar = true)]
			private static extern int transmux(string path, string outpath, out float playableDuration);

			public static int Transmux(string path, string outPath, out float playableDuration)
			{
				path = path.Replace('\\', '/');
				outPath = outPath.Replace('\\', '/');
				return transmux(path, outPath, out playableDuration);
			}

			[DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl,
				CharSet = CharSet.Ansi, BestFitMapping = false, ThrowOnUnmappableChar = true)]
			private static extern IntPtr extract_infos(string path,
				string outpath,
				out uint length,
				out uint trackCount,
				bool reextracct);

			[DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
			private static extern void free_streams(IntPtr streams, uint count);


			public static Track[] ExtractInfos(string path, string outPath, bool reextract)
			{
				path = path.Replace('\\', '/');
				outPath = outPath.Replace('\\', '/');

				int size = Marshal.SizeOf<Models.Watch.Stream>();
				IntPtr ptr = extract_infos(path, outPath, out uint arrayLength, out uint trackCount, reextract);
				IntPtr streamsPtr = ptr;
				Track[] tracks;

				if (trackCount > 0 && ptr != IntPtr.Zero)
				{
					tracks = new Track[trackCount];

					int j = 0;
					for (int i = 0; i < arrayLength; i++)
					{
						Models.Watch.Stream stream = Marshal.PtrToStructure<Models.Watch.Stream>(streamsPtr);
						if (stream!.Type != StreamType.Unknown)
						{
							tracks[j] = stream.ToTrack();
							j++;
						}
						streamsPtr += size;
					}
				}
				else
					tracks = Array.Empty<Track>();

				if (ptr != IntPtr.Zero)
					free_streams(ptr, trackCount);
				return tracks;
			}
		}

		private readonly IFileSystem _files;
		private readonly IOptions<BasicOptions> _options;
		private readonly Lazy<ILibraryManager> _library;

		public Transcoder(IFileSystem files, IOptions<BasicOptions> options, Lazy<ILibraryManager> library)
		{
			_files = files;
			_options = options;
			_library = library;

			if (TranscoderAPI.Init() != Marshal.SizeOf<Models.Watch.Stream>())
				throw new BadTranscoderException();
		}

		public async Task<Track[]> ExtractInfos(Episode episode, bool reextract)
		{
			await _library.Value.Load(episode, x => x.Show);
			string dir = await _files.GetExtraDirectory(episode.Show);
			if (dir == null)
				throw new ArgumentException("Invalid path.");
			return await Task.Factory.StartNew(
				() => TranscoderAPI.ExtractInfos(episode.Path, dir, reextract),
				TaskCreationOptions.LongRunning);
		}

		public async Task<string> Transmux(Episode episode)
		{
			if (!File.Exists(episode.Path))
				throw new ArgumentException("Path does not exists. Can't transcode.");

			string folder = Path.Combine(_options.Value.TransmuxPath, episode.Slug);
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
				transmuxFailed = TranscoderAPI.Transmux(episode.Path, manifest, out playableDuration) != 0;
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
