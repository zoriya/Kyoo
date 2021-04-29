using System.IO;
using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using Kyoo.Models.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Kyoo.Api
{
	[Route("video")]
	[ApiController]
	public class VideoApi : Controller
	{
		private readonly ILibraryManager _libraryManager;
		private readonly ITranscoder _transcoder;
		private readonly IFileManager _files;
		private readonly string _transmuxPath;
		private readonly string _transcodePath;

		public VideoApi(ILibraryManager libraryManager, 
			ITranscoder transcoder, 
			IConfiguration config,
			IFileManager files)
		{
			_libraryManager = libraryManager;
			_transcoder = transcoder;
			_files = files;
			_transmuxPath = config.GetValue<string>("transmuxTempPath");
			_transcodePath = config.GetValue<string>("transcodeTempPath");
		}

		public override void OnActionExecuted(ActionExecutedContext ctx)
		{
			base.OnActionExecuted(ctx);
			// Disabling the cache prevent an issue on firefox that skip the last 30 seconds of HLS files.
			ctx.HttpContext.Response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate");
			ctx.HttpContext.Response.Headers.Add("Pragma", "no-cache");
			ctx.HttpContext.Response.Headers.Add("Expires", "0");
		}

		
		[HttpGet("{slug}")]
		[HttpGet("direct/{slug}")]
		[Authorize(Policy="Play")]
		public async Task<IActionResult> Direct(string slug)
		{
			try
			{
				Episode episode = await _libraryManager.Get<Episode>(slug);
				return _files.FileResult(episode.Path, true);
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
		}

		[HttpGet("transmux/{slug}/master.m3u8")]
		[Authorize(Policy="Play")]
		public async Task<IActionResult> Transmux(string slug)
		{
			try
			{
				Episode episode = await _libraryManager.Get<Episode>(slug);
				string path = await _transcoder.Transmux(episode);

				if (path == null)
					return StatusCode(500);
				return _files.FileResult(path, true);
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
		}

		[HttpGet("transcode/{slug}/master.m3u8")]
		[Authorize(Policy="Play")]
		public async Task<IActionResult> Transcode(string slug)
		{
			try
			{
				Episode episode = await _libraryManager.Get<Episode>(slug);
				string path = await _transcoder.Transcode(episode);

				if (path == null)
					return StatusCode(500);
				return _files.FileResult(path, true);
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
		}
		
		
		[HttpGet("transmux/{episodeLink}/segments/{chunk}")]
		[Authorize(Policy="Play")]
		public IActionResult GetTransmuxedChunk(string episodeLink, string chunk)
		{
			string path = Path.GetFullPath(Path.Combine(_transmuxPath, episodeLink));
			path = Path.Combine(path, "segments", chunk);
			return PhysicalFile(path, "video/MP2T");
		}
		
		[HttpGet("transcode/{episodeLink}/segments/{chunk}")]
		[Authorize(Policy="Play")]
		public IActionResult GetTranscodedChunk(string episodeLink, string chunk)
		{
			string path = Path.GetFullPath(Path.Combine(_transcodePath, episodeLink));
			path = Path.Combine(path, "segments", chunk);
			return PhysicalFile(path, "video/MP2T");
		}
	}
}