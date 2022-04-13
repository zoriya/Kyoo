// Kyoo - A portable and vast media library solution.
// Copyright (c) Kyoo.
//
// See AUTHORS.md and LICENSE file in the project root for full license information.
//
// Kyoo is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// any later version.
//
// Kyoo is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Kyoo. If not, see <https://www.gnu.org/licenses/>.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Core.Models.Options;
using Kyoo.Core.Models.Watch;
using Kyoo.Utils;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Kyoo.Core.Controllers
{
	/// <summary>
	/// The transcoder used by the <see cref="LocalFileSystem"/>.
	/// </summary>
	public class Transcoder : ITranscoder
	{
#pragma warning disable IDE1006
		/// <summary>
		/// The class that interact with the transcoder written in C.
		/// </summary>
		private static class TranscoderAPI
		{
			/// <summary>
			/// The name of the library. For windows '.dll' should be appended, on linux or macos it should be prefixed
			/// by 'lib' and '.so' or '.dylib' should be appended.
			/// </summary>
			private const string TranscoderPath = "transcoder";

			/// <summary>
			/// Initialize the C library, setup the logger and return the size of a <see cref="FTrack"/>.
			/// </summary>
			/// <returns>The size of a <see cref="FTrack"/></returns>
			[DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
			private static extern int init();

			/// <summary>
			/// Initialize the C library, setup the logger and return the size of a <see cref="FTrack"/>.
			/// </summary>
			/// <returns>The size of a <see cref="FTrack"/></returns>
			public static int Init() => init();

			/// <summary>
			/// Transmux the file at the specified path. The path must be a local one with '/' as a separator.
			/// </summary>
			/// <param name="path">The path of a local file with '/' as a separators.</param>
			/// <param name="outPath">The path of the hls output file.</param>
			/// <param name="playableDuration">
			/// The number of seconds currently playable. This is incremented as the file gets transmuxed.
			/// </param>
			/// <returns><c>0</c> on success, non 0 on failure.</returns>
			[DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl,
				CharSet = CharSet.Ansi, BestFitMapping = false, ThrowOnUnmappableChar = true)]
			private static extern int transmux(string path, string outPath, out float playableDuration);

			/// <summary>
			/// Transmux the file at the specified path. The path must be a local one.
			/// </summary>
			/// <param name="path">The path of a local file.</param>
			/// <param name="outPath">The path of the hls output file.</param>
			/// <param name="playableDuration">
			/// The number of seconds currently playable. This is incremented as the file gets transmuxed.
			/// </param>
			/// <returns><c>0</c> on success, non 0 on failure.</returns>
			public static int Transmux(string path, string outPath, out float playableDuration)
			{
				path = path.Replace('\\', '/');
				outPath = outPath.Replace('\\', '/');
				return transmux(path, outPath, out playableDuration);
			}

			/// <summary>
			/// Retrieve tracks from a video file and extract subtitles, fonts and chapters to an external file.
			/// </summary>
			/// <param name="path">
			/// The path of the video file to analyse. This must be a local path with '/' as a separator.
			/// </param>
			/// <param name="outPath">The directory that will be used to store extracted files.</param>
			/// <param name="length">The size of the returned array.</param>
			/// <param name="trackCount">The number of tracks in the returned array.</param>
			/// <param name="reExtract">Should the cache be invalidated and information re-extracted or not?</param>
			/// <returns>A pointer to an array of <see cref="FTrack"/></returns>
			[DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl,
				CharSet = CharSet.Ansi, BestFitMapping = false, ThrowOnUnmappableChar = true)]
			private static extern IntPtr extract_infos(string path,
				string outPath,
				out uint length,
				out uint trackCount,
				bool reExtract);

			/// <summary>
			/// An helper method to free an array of <see cref="FTrack"/>.
			/// </summary>
			/// <param name="streams">A pointer to the first element of the array</param>
			/// <param name="count">The number of items in the array.</param>
			[DllImport(TranscoderPath, CallingConvention = CallingConvention.Cdecl)]
			private static extern void free_streams(IntPtr streams, uint count);

			/// <summary>
			/// Retrieve tracks from a video file and extract subtitles, fonts and chapters to an external file.
			/// </summary>
			/// <param name="path">The path of the video file to analyse. This must be a local path.</param>
			/// <param name="outPath">The directory that will be used to store extracted files.</param>
			/// <param name="reExtract">Should the cache be invalidated and information re-extracted or not?</param>
			/// <returns>An array of <see cref="Track"/>.</returns>
			public static Track[] ExtractInfos(string path, string outPath, bool reExtract)
			{
				path = path.Replace('\\', '/');
				outPath = outPath.Replace('\\', '/');

				int size = Marshal.SizeOf<FTrack>();
				IntPtr ptr = extract_infos(path, outPath, out uint arrayLength, out uint trackCount, reExtract);
				IntPtr streamsPtr = ptr;
				Track[] tracks;

				if (trackCount > 0 && ptr != IntPtr.Zero)
				{
					tracks = new Track[trackCount];

					int j = 0;
					for (int i = 0; i < arrayLength; i++)
					{
						FTrack stream = Marshal.PtrToStructure<FTrack>(streamsPtr);
						if (stream!.Type != FTrackType.Unknown && stream.Type != FTrackType.Attachment)
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
#pragma warning restore IDE1006

		/// <summary>
		/// The file system used to retrieve the extra directory of shows to know where to extract information.
		/// </summary>
		private readonly IFileSystem _files;

		/// <summary>
		/// Options to know where to cache transmuxed/transcoded episodes.
		/// </summary>
		private readonly IOptions<BasicOptions> _options;

		/// <summary>
		/// The logger to use. This is also used by the wrapped C library.
		/// </summary>
		private readonly ILogger<Transcoder> _logger;

		/// <summary>
		/// Create a new <see cref="Transcoder"/>.
		/// </summary>
		/// <param name="files">
		/// The file system used to retrieve the extra directory of shows to know where to extract information.
		/// </param>
		/// <param name="options">Options to know where to cache transmuxed/transcoded episodes.</param>
		/// <param name="logger">The logger to use. This is also used by the wrapped C library.</param>
		public Transcoder(IFileSystem files, IOptions<BasicOptions> options, ILogger<Transcoder> logger)
		{
			_files = files;
			_options = options;
			_logger = logger;

			if (TranscoderAPI.Init() != Marshal.SizeOf<FTrack>())
				_logger.LogCritical("The transcoder library could not be initialized correctly");
		}

		/// <inheritdoc />
		public async Task<ICollection<Track>> ExtractInfos(Episode episode, bool reExtract)
		{
			string dir = await _files.GetExtraDirectory(episode);
			if (dir == null)
				throw new ArgumentException("Invalid path.");
			return await Task.Factory.StartNew(
				() => TranscoderAPI.ExtractInfos(episode.Path, dir, reExtract),
				TaskCreationOptions.LongRunning
			);
		}

		/// <inheritdoc/>
		public async Task<ICollection<Font>> ListFonts(Episode episode)
		{
			string path = _files.Combine(await _files.GetExtraDirectory(episode), "Attachments");
			return (await _files.ListFiles(path))
				.Select(x => new Font(x))
				.ToArray();
		}

		/// <inheritdoc/>
		public async Task<Font> GetFont(Episode episode, string slug)
		{
			string path = _files.Combine(await _files.GetExtraDirectory(episode), "Attachments");
			string font = (await _files.ListFiles(path))
				.FirstOrDefault(x => Utility.ToSlug(Path.GetFileName(x)) == slug);
			if (font == null)
				return null;
			return new Font(path);
		}

		/// <inheritdoc />
		public IActionResult Transmux(Episode episode)
		{
			string folder = Path.Combine(_options.Value.TransmuxPath, episode.Slug);
			string manifest = Path.GetFullPath(Path.Combine(folder, episode.Slug + ".m3u8"));

			try
			{
				Directory.CreateDirectory(folder);
				if (File.Exists(manifest))
					return new PhysicalFileResult(manifest, "application/x-mpegurl");
			}
			catch (UnauthorizedAccessException)
			{
				_logger.LogCritical("Access to the path {Manifest} is denied. " +
					"Please change your transmux path in the config", manifest);
				return new StatusCodeResult(500);
			}

			return new TransmuxResult(episode.Path, manifest, _logger);
		}

		/// <summary>
		/// An action result that runs the transcoder and return the created manifest file after a few seconds of
		/// the video has been proceeded. If the transcoder fails, it returns a 500 error code.
		/// </summary>
		private class TransmuxResult : IActionResult
		{
			/// <summary>
			/// The path of the episode to transmux. It must be a local one.
			/// </summary>
			private readonly string _path;

			/// <summary>
			/// The path of the manifest file to create. It must be a local one.
			/// </summary>
			private readonly string _manifest;

			/// <summary>
			/// The logger to use in case of issue.
			/// </summary>
			private readonly ILogger _logger;

			/// <summary>
			/// Create a new <see cref="TransmuxResult"/>.
			/// </summary>
			/// <param name="path">The path of the episode to transmux. It must be a local one.</param>
			/// <param name="manifest">The path of the manifest file to create. It must be a local one.</param>
			/// <param name="logger">The logger to use in case of issue.</param>
			public TransmuxResult(string path, string manifest, ILogger logger)
			{
				_path = path;
				_manifest = Path.GetFullPath(manifest);
				_logger = logger;
			}

			// We use threads so tasks are not always awaited.
#pragma warning disable 4014

			/// <inheritdoc />
			public async Task ExecuteResultAsync(ActionContext context)
			{
				float playableDuration = 0;
				bool transmuxFailed = false;

				Task.Factory.StartNew(() =>
				{
					transmuxFailed = TranscoderAPI.Transmux(_path, _manifest, out playableDuration) != 0;
				}, TaskCreationOptions.LongRunning);

				while (playableDuration < 10 || (!File.Exists(_manifest) && !transmuxFailed))
					await Task.Delay(10);

				if (!transmuxFailed)
				{
					new PhysicalFileResult(_manifest, "application/x-mpegurl")
						.ExecuteResultAsync(context);
				}
				else
				{
					_logger.LogCritical("The transmuxing failed on the C library");
					new StatusCodeResult(500)
						.ExecuteResultAsync(context);
				}
			}

#pragma warning restore 4014
		}
	}
}
