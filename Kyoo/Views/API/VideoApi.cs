using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.StaticFiles;

namespace Kyoo.Api
{
	[Route("video")]
	[ApiController]
	public class VideoApi : ControllerBase
	{
		private readonly ILibraryManager _libraryManager;
		private readonly ITranscoder _transcoder;
		private readonly string _transmuxPath;
		private readonly string _transcodePath;
		private FileExtensionContentTypeProvider _provider;

		public VideoApi(ILibraryManager libraryManager, ITranscoder transcoder, IConfiguration config)
		{
			_libraryManager = libraryManager;
			_transcoder = transcoder;
			_transmuxPath = config.GetValue<string>("transmuxTempPath");
			_transcodePath = config.GetValue<string>("transcodeTempPath");
		}

		private string _GetContentType(string path)
		{
			if (_provider == null)
			{
				_provider = new FileExtensionContentTypeProvider();
				_provider.Mappings[".mkv"] = "video/x-matroska";
			}

			if (_provider.TryGetContentType(path, out string contentType))
				return contentType;
			return "video/mp4";
		}
		

		[HttpGet("{showSlug}-s{seasonNumber}e{episodeNumber}")]
		[HttpGet("direct/{showSlug}-s{seasonNumber}e{episodeNumber}")]
		[Authorize(Policy="Play")]
		public async Task<IActionResult> DirectEpisode(string showSlug, int seasonNumber, int episodeNumber)
		{
			if (seasonNumber < 0 || episodeNumber < 0)
				return BadRequest(new {error = "Season number or episode number can not be negative."});

			Episode episode = await _libraryManager.GetEpisode(showSlug, seasonNumber, episodeNumber);
			if (episode != null && System.IO.File.Exists(episode.Path))
				return PhysicalFile(episode.Path, _GetContentType(episode.Path), true);
			return NotFound();
		}
		
		[HttpGet("{movieSlug}")]
		[HttpGet("direct/{movieSlug}")]
		[Authorize(Policy="Play")]
		public async Task<IActionResult> DirectMovie(string movieSlug)
		{
			Episode episode = await _libraryManager.GetMovieEpisode(movieSlug);

			if (episode != null && System.IO.File.Exists(episode.Path))
				return PhysicalFile(episode.Path, _GetContentType(episode.Path), true);
			return NotFound();
		}
		

		[HttpGet("transmux/{showSlug}-s{seasonNumber}e{episodeNumber}")]
		[Authorize(Policy="Play")]
		public async Task<IActionResult> TransmuxEpisode(string showSlug, int seasonNumber, int episodeNumber)
		{
			if (seasonNumber < 0 || episodeNumber < 0)
				return BadRequest(new {error = "Season number or episode number can not be negative."});
			
			Episode episode = await _libraryManager.GetEpisode(showSlug, seasonNumber, episodeNumber);
			if (episode == null || !System.IO.File.Exists(episode.Path))
				return NotFound();
			string path = await _transcoder.Transmux(episode);
			if (path == null)
				return StatusCode(500);
			return PhysicalFile(path, "application/x-mpegurl", true);
		}
		
		[HttpGet("transmux/{movieSlug}")]
		[Authorize(Policy="Play")]
		public async Task<IActionResult> TransmuxMovie(string movieSlug)
		{
			Episode episode = await _libraryManager.GetMovieEpisode(movieSlug);

			if (episode == null || !System.IO.File.Exists(episode.Path))
				return NotFound();
			string path = await _transcoder.Transmux(episode);
			if (path == null)
				return StatusCode(500);
			return PhysicalFile(path, "application/x-mpegurl", true);
		}

		[HttpGet("transcode/{showSlug}-s{seasonNumber}e{episodeNumber}")]
		[Authorize(Policy="Play")]
		public async Task<IActionResult> TranscodeEpisode(string showSlug, int seasonNumber, int episodeNumber)
		{
			if (seasonNumber < 0 || episodeNumber < 0)
				return BadRequest(new {error = "Season number or episode number can not be negative."});
			
			Episode episode = await _libraryManager.GetEpisode(showSlug, seasonNumber, episodeNumber);
			if (episode == null || !System.IO.File.Exists(episode.Path))
				return NotFound();
			string path = await _transcoder.Transcode(episode);
			if (path == null)
				return StatusCode(500);
			return PhysicalFile(path, "application/x-mpegurl", true);
		}
		
		[HttpGet("transcode/{movieSlug}")]
		[Authorize(Policy="Play")]
		public async Task<IActionResult> TranscodeMovie(string movieSlug)
		{
			Episode episode = await _libraryManager.GetMovieEpisode(movieSlug);

			if (episode == null || !System.IO.File.Exists(episode.Path))
				return NotFound();
			string path = await _transcoder.Transcode(episode);
			if (path == null)
				return StatusCode(500);
			return PhysicalFile(path, "application/x-mpegurl", true);
		}
		
		
		[HttpGet("transmux/{episodeLink}/segment/{chunk}")]
		[Authorize(Policy="Play")]
		public IActionResult GetTransmuxedChunk(string episodeLink, string chunk)
		{
			string path = Path.GetFullPath(Path.Combine(_transmuxPath, episodeLink));
			path = Path.Combine(path, "segments", chunk);
			return PhysicalFile(path, "video/MP2T");
		}
		
		[HttpGet("transcode/{episodeLink}/segment/{chunk}")]
		[Authorize(Policy="Play")]
		public IActionResult GetTranscodedChunk(string episodeLink, string chunk)
		{
			string path = Path.GetFullPath(Path.Combine(_transcodePath, episodeLink));
			path = Path.Combine(path, "segments", chunk);
			return PhysicalFile(path, "video/MP2T");
		}
	}
}