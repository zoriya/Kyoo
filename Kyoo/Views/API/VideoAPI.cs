using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

namespace Kyoo.Api
{
	[Route("[controller]")]
	[ApiController]
	public class VideoController : ControllerBase
	{
		private readonly ILibraryManager _libraryManager;
		private readonly ITranscoder _transcoder;
		private readonly string _transmuxPath;
		private readonly string _transcodePath;

		public VideoController(ILibraryManager libraryManager, ITranscoder transcoder, IConfiguration config)
		{
			_libraryManager = libraryManager;
			_transcoder = transcoder;
			_transmuxPath = config.GetValue<string>("transmuxTempPath");
			_transcodePath = config.GetValue<string>("transcodeTempPath");
		}

		[HttpGet("{showSlug}-s{seasonNumber}e{episodeNumber}")]
		[Authorize(Policy="Play")]
		public async Task<IActionResult> Index(string showSlug, long seasonNumber, long episodeNumber)
		{
			Episode episode = await _libraryManager.GetEpisode(showSlug, seasonNumber, episodeNumber);

			if (episode != null && System.IO.File.Exists(episode.Path))
				return PhysicalFile(episode.Path, "video/x-matroska", true);
			return NotFound();
		}

		[HttpGet("transmux/{showSlug}-s{seasonNumber}e{episodeNumber}")]
		[Authorize(Policy="Play")]
		public async Task<IActionResult> Transmux(string showSlug, long seasonNumber, long episodeNumber)
		{
			Episode episode = await _libraryManager.GetEpisode(showSlug, seasonNumber, episodeNumber);

			if (episode == null || !System.IO.File.Exists(episode.Path))
				return NotFound();
			string path = await _transcoder.Transmux(episode);
			if (path != null)
				return PhysicalFile(path, "application/x-mpegURL ", true);
			return StatusCode(500);
		}

		[HttpGet("transmux/{episodeLink}/segment/{chunk}")]
		public IActionResult GetTransmuxedChunk(string episodeLink, string chunk)
		{
			string path = Path.GetFullPath(Path.Combine(_transmuxPath, episodeLink));
			path = Path.Combine(path, "segments" + Path.DirectorySeparatorChar + chunk);

			return PhysicalFile(path, "video/MP2T");
		}

		[HttpGet("transcode/{showSlug}-s{seasonNumber}e{episodeNumber}")]
		[Authorize(Policy="Play")]
		public async Task<IActionResult> Transcode(string showSlug, long seasonNumber, long episodeNumber)
		{
			Episode episode = await _libraryManager.GetEpisode(showSlug, seasonNumber, episodeNumber);

			if (episode == null || !System.IO.File.Exists(episode.Path))
				return NotFound();
			string path = await _transcoder.Transcode(episode);
			if (path != null)
				return PhysicalFile(path, "application/x-mpegURL ", true);
			return StatusCode(500);
		}
		
		[HttpGet("transcode/{episodeLink}/segment/{chunk}")]
		public IActionResult GetTranscodedChunk(string episodeLink, string chunk)
		{
			string path = Path.GetFullPath(Path.Combine(_transcodePath, episodeLink));
			path = Path.Combine(path, "segments" + Path.DirectorySeparatorChar + chunk);

			return PhysicalFile(path, "video/MP2T");
		}
		
		
		[HttpGet("{movieSlug}")]
		[Authorize(Policy="Play")]
		public async Task<IActionResult> Index(string movieSlug)
		{
			Episode episode = await _libraryManager.GetMovieEpisode(movieSlug);

			if (episode != null && System.IO.File.Exists(episode.Path))
				return PhysicalFile(episode.Path, "video/webm", true);
			return NotFound();
		}

		[HttpGet("transmux/{movieSlug}")]
		[Authorize(Policy="Play")]
		public async Task<IActionResult> Transmux(string movieSlug)
		{
			Episode episode = await _libraryManager.GetMovieEpisode(movieSlug);

			if (episode == null || !System.IO.File.Exists(episode.Path))
				return NotFound();
			string path = await _transcoder.Transmux(episode);
			if (path != null)
				return PhysicalFile(path, "application/x-mpegURL ", true);
			return StatusCode(500);
		}

		[HttpGet("transcode/{movieSlug}")]
		[Authorize(Policy="Play")]
		public async Task<IActionResult> Transcode(string movieSlug)
		{
			Episode episode = await _libraryManager.GetMovieEpisode(movieSlug);

			if (episode == null || !System.IO.File.Exists(episode.Path))
				return NotFound();
			string path = await _transcoder.Transcode(episode);
			if (path != null)
				return PhysicalFile(path, "application/x-mpegURL ", true);
			return StatusCode(500);
		}
	}
}