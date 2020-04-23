using System;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Kyoo.Controllers;
using Microsoft.AspNetCore.Authorization;

namespace Kyoo.Api
{
	[Route("[controller]")]
	[ApiController]
	public class SubtitleController : ControllerBase
	{
		private readonly ILibraryManager _libraryManager;
		private readonly ITranscoder _transcoder;

		public SubtitleController(ILibraryManager libraryManager, ITranscoder transcoder)
		{
			_libraryManager = libraryManager;
			_transcoder = transcoder;
		}

		[HttpGet("{showSlug}-s{seasonNumber:int}e{episodeNumber:int}.{identifier}.{extension?}")]
		[Authorize(Policy="Play")]
		public IActionResult GetSubtitle(string showSlug, int seasonNumber, int episodeNumber, string identifier, string extension)
		{
			string languageTag = identifier.Length == 3 ? identifier.Substring(0, 3) : null;
			bool forced = identifier.Length > 4 && identifier.Substring(4) == "forced";
			Track subtitle = null;
			
			if (languageTag != null)
				subtitle = _libraryManager.GetSubtitle(showSlug, seasonNumber, episodeNumber, languageTag, forced);
				
			if (subtitle == null)
			{
				string idString = identifier.IndexOf('-') != -1 ? identifier.Substring(0, identifier.IndexOf('-')) : identifier;
				long.TryParse(idString, out long id);
				subtitle = _libraryManager.GetSubtitleById(id);
			}
			
			if (subtitle == null)
				return NotFound();
			
			if (subtitle.Codec == "subrip" && extension == "vtt") //The request wants a WebVTT from a Subrip subtitle, convert it on the fly and send it.
			{
				return new ConvertSubripToVtt(subtitle.Path);
			}

			string mime;
			if (subtitle.Codec == "ass")
				mime = "text/x-ssa";
			else
				mime = "application/x-subrip";

			//Should use appropriate mime type here
			return PhysicalFile(subtitle.Path, mime);
		}

		[HttpGet("extract/{showSlug}-s{seasonNumber}e{episodeNumber}")]
		[Authorize(Policy="Admin")]
		public async Task<string> ExtractSubtitle(string showSlug, long seasonNumber, long episodeNumber)
		{
			Episode episode = _libraryManager.GetEpisode(showSlug, seasonNumber, episodeNumber);
			_libraryManager.ClearSubtitles(episode.ID);

			Track[] tracks = await _transcoder.ExtractSubtitles(episode.Path);
			foreach (Track track in tracks)
			{
				track.EpisodeID = episode.ID;
				_libraryManager.RegisterTrack(track);
			}

			return "Done. " + tracks.Length + " track(s) extracted.";
		}

		[HttpGet("extract/{showSlug}")]
		[Authorize(Policy="Admin")]
		public async Task<string> ExtractSubtitle(string showSlug)
		{
			IEnumerable<Episode> episodes = _libraryManager.GetEpisodes(showSlug);
			foreach (Episode episode in episodes)
			{
				_libraryManager.ClearSubtitles(episode.ID);

				Track[] tracks = await _transcoder.ExtractSubtitles(episode.Path);
				foreach (Track track in tracks)
				{
					track.EpisodeID = episode.ID;
					_libraryManager.RegisterTrack(track);
				}
			}

			return "Done.";
		}
	}


	public class ConvertSubripToVtt : IActionResult
	{
		private readonly string _path;

		public ConvertSubripToVtt(string subtitlePath)
		{
			_path = subtitlePath;
		}

		public async Task ExecuteResultAsync(ActionContext context)
		{
			string line;
			List<string> lines = new List<string>();

			context.HttpContext.Response.StatusCode = 200;
			context.HttpContext.Response.Headers.Add("Content-Type", "text/vtt");

			await using (StreamWriter writer = new StreamWriter(context.HttpContext.Response.Body))
			{
				await writer.WriteLineAsync("WEBVTT");
				await writer.WriteLineAsync("");
				await writer.WriteLineAsync("");

				using (StreamReader reader = new StreamReader(_path))
				{
					while ((line = await reader.ReadLineAsync()) != null)
					{
						if (line == "")
						{
							lines.Add("");
							IEnumerable<string> processedBlock = ConvertBlock(lines);
							foreach (string t in processedBlock)
								await writer.WriteLineAsync(t);
							lines.Clear();
						}
						else
							lines.Add(line);
					}
				}
			}

			await context.HttpContext.Response.Body.FlushAsync();
		}

		private static IEnumerable<string> ConvertBlock(IList<string> lines)
		{
			lines[1] = lines[1].Replace(',', '.');
			if (lines[2].Length > 5)
			{
				lines[1] += lines[2].Substring(0, 6) switch
				{
					"{\\an1}" => " line:93% position:15%",
					"{\\an2}" => " line:93%",
					"{\\an3}" => " line:93% position:85%",
					"{\\an4}" => " line:50% position:15%",
					"{\\an5}" => " line:50%",
					"{\\an6}" => " line:50% position:85%",
					"{\\an7}" => " line:7% position:15%",
					"{\\an8}" => " line:7%",
					"{\\an9}" => " line:7% position:85%",
					_ => " line:93%"
				};
			}

			if (lines[2].StartsWith("{\\an"))
				lines[2] = lines[2].Substring(6);

			return lines;
		}
	}
}