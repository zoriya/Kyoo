using System;
using Kyoo.Models;
using Microsoft.Extensions.Configuration;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using Kyoo.Controllers.TranscoderLink;

#pragma warning disable 4014

namespace Kyoo.Controllers
{
	public class BadTranscoderException : Exception {}
	
	public class Transcoder : ITranscoder
	{
		private readonly string _transmuxPath;
		private readonly string _transcodePath;

		public Transcoder(IConfiguration config)
		{
			_transmuxPath = Path.GetFullPath(config.GetValue<string>("transmuxTempPath"));
			_transcodePath = Path.GetFullPath(config.GetValue<string>("transcodeTempPath"));

			if (TranscoderAPI.init() != Marshal.SizeOf<Models.Watch.Stream>())
				throw new BadTranscoderException();
		}

		public async Task<Track[]> GetTrackInfo(string path)
		{
			return await Task.Run(() =>
			{
				TranscoderAPI.GetTrackInfo(path, out Track[] tracks);
				return tracks;
			});
		}

		public async Task<Track[]> ExtractSubtitles(string path)
		{
			string output = Path.Combine(Path.GetDirectoryName(path), "Subtitles");
			Directory.CreateDirectory(output);
			return await Task.Run(() => 
			{ 
				TranscoderAPI.ExtractSubtitles(path, output, out Track[] tracks);
				return tracks;
			});
		}

		public async Task<string> Transmux(Episode episode)
		{
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
			Task.Run(() => 
			{ 
				transmuxFailed = TranscoderAPI.transmux(episode.Path, manifest.Replace('\\', '/'), out playableDuration) != 0;
			});
			while (playableDuration < 10 || (!File.Exists(manifest) && !transmuxFailed))
				await Task.Delay(10);
			return transmuxFailed ? null : manifest;
		}

		public Task<string> Transcode(Episode episode)
		{
			return null; // Not implemented yet.
		}
	}
}
