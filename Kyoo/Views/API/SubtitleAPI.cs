using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Kyoo.Controllers;

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
		public IActionResult GetSubtitle(string showSlug, int seasonNumber, int episodeNumber, string identifier, string extension)
		{
			bool forced = identifier.Length > 3 && identifier.Substring(4) == "forced";
			Track subtitle;
			
			if (identifier.Length >= 3 && identifier[3] == '-')
			{
				string languageTag = identifier.Substring(0, 3);
				subtitle = _libraryManager.GetSubtitle(showSlug, seasonNumber, episodeNumber, languageTag, forced);
			}
			else
			{
				long.TryParse(identifier.Substring(0, 3), out long id);
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
							List<string> processedBlock = ConvertBlock(lines);
							for (int i = 0; i < processedBlock.Count; i++)
								await writer.WriteLineAsync(processedBlock[i]);
							lines.Clear();
						}
						else
							lines.Add(line);
					}
				}
			}

			await context.HttpContext.Response.Body.FlushAsync();
		}

		private static List<string> ConvertBlock(List<string> lines)
		{
			lines[1] = lines[1].Replace(',', '.');
			if (lines[2].Length > 5)
			{
				switch (lines[2].Substring(0, 6))
				{
					case "{\\an1}":
						lines[1] += " line:93% position:15%";
						break;
					case "{\\an2}":
						lines[1] += " line:93%";
						break;
					case "{\\an3}":
						lines[1] += " line:93% position:85%";
						break;
					case "{\\an4}":
						lines[1] += " line:50% position:15%";
						break;
					case "{\\an5}":
						lines[1] += " line:50%";
						break;
					case "{\\an6}":
						lines[1] += " line:50% position:85%";
						break;
					case "{\\an7}":
						lines[1] += " line:7% position:15%";
						break;
					case "{\\an8}":
						lines[1] += " line:7%";
						break;
					case "{\\an9}":
						lines[1] += " line:7% position:85%";
						break;
					default:
						lines[1] += " line:93%";
						break;
				}
			}

			if (lines[2].StartsWith("{\\an"))
				lines[2] = lines[2].Substring(6);

			return lines;
		}
	}
}