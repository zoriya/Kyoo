using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models.Permissions;

namespace Kyoo.Api
{
	[Route("subtitle")]
	[ApiController]
	public class SubtitleApi : ControllerBase
	{
		private readonly ILibraryManager _libraryManager;
		private readonly IFileSystem _files;

		public SubtitleApi(ILibraryManager libraryManager, IFileSystem files)
		{
			_libraryManager = libraryManager;
			_files = files;
		}
		
		[HttpGet("{id:int}")]
		[Permission(nameof(SubtitleApi), Kind.Read)]
		public async Task<IActionResult> GetSubtitle(int id)
		{
			Track subtitle = await _libraryManager.GetOrDefault<Track>(id);
			return subtitle != null
				? _files.FileResult(subtitle.Path)
				: NotFound();
		}
		
		[HttpGet("{id:int}.{extension}")]
		[Permission(nameof(SubtitleApi), Kind.Read)]
		public async Task<IActionResult> GetSubtitle(int id, string extension)
		{
			Track subtitle = await _libraryManager.GetOrDefault<Track>(id);
			if (subtitle == null)
				return NotFound();
			if (subtitle.Codec == "subrip" && extension == "vtt")
				return new ConvertSubripToVtt(subtitle.Path, _files);
			return _files.FileResult(subtitle.Path);
		}
		
		
		[HttpGet("{slug}")]
		[Permission(nameof(SubtitleApi), Kind.Read)]
		public async Task<IActionResult> GetSubtitle(string slug)
		{
			string extension = null;
			
			if (slug.Count(x => x == '.') == 2)
			{
				int idx = slug.LastIndexOf('.');
				extension = slug[(idx + 1)..];
				slug = slug[..idx];
			}

			Track subtitle = await _libraryManager.GetOrDefault<Track>(Track.BuildSlug(slug, StreamType.Subtitle));
			if (subtitle == null)
				return NotFound();
			if (subtitle.Codec == "subrip" && extension == "vtt")
				return new ConvertSubripToVtt(subtitle.Path, _files);
			return _files.FileResult(subtitle.Path);
		}
	}


	public class ConvertSubripToVtt : IActionResult
	{
		private readonly string _path;
		private readonly IFileSystem _files;

		public ConvertSubripToVtt(string subtitlePath, IFileSystem files)
		{
			_path = subtitlePath;
			_files = files;
		}

		public async Task ExecuteResultAsync(ActionContext context)
		{
			List<string> lines = new();

			context.HttpContext.Response.StatusCode = 200;
			context.HttpContext.Response.Headers.Add("Content-Type", "text/vtt");

			await using (StreamWriter writer = new(context.HttpContext.Response.Body))
			{
				await writer.WriteLineAsync("WEBVTT");
				await writer.WriteLineAsync("");
				await writer.WriteLineAsync("");

				using StreamReader reader = new(await _files.GetReader(_path));
				string line;
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
