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
	[Route("subtitle")]
	[ApiController]
	public class SubtitleApi : ControllerBase
	{
		private readonly ILibraryManager _libraryManager;

		public SubtitleApi(ILibraryManager libraryManager)
		{
			_libraryManager = libraryManager;
		}
		
		
		[HttpGet("{slug}.{extension?}")]
		[Authorize(Policy="Play")]
		public async Task<IActionResult> GetSubtitle(string slug, string extension)
		{
			Track subtitle;
			try
			{
				subtitle = await _libraryManager.GetTrack(slug, StreamType.Subtitle);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {error = ex.Message});
			}

			if (subtitle == null || subtitle.Type != StreamType.Subtitle)
				return NotFound();
			
			if (subtitle.Codec == "subrip" && extension == "vtt")
				return new ConvertSubripToVtt(subtitle.Path);
			string mime = subtitle.Codec == "ass" ? "text/x-ssa" : "application/x-subrip";
			return PhysicalFile(subtitle.Path, mime);
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

				using StreamReader reader = new StreamReader(_path);
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

			await context.HttpContext.Response.Body.FlushAsync();
		}

		private static IEnumerable<string> ConvertBlock(IList<string> lines)
		{
			if (lines.Count < 3)
				return lines;		
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
