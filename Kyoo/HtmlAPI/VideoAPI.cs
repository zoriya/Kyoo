using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.IO;
using System.Threading.Tasks;

namespace Kyoo.Api
{
	[Route("[controller]")]
	[ApiController]
	public class VideoController : ControllerBase
	{
		private readonly ILibraryManager _libraryManager;
		private readonly ITranscoder _transcoder;
		private readonly string _transmuxPath;

		public VideoController(ILibraryManager libraryManager, ITranscoder transcoder, IConfiguration config)
		{
			_libraryManager = libraryManager;
			_transcoder = transcoder;
			_transmuxPath = config.GetValue<string>("transmuxTempPath");
		}

		[HttpGet("{showSlug}-s{seasonNumber}e{episodeNumber}")]
		public IActionResult Index(string showSlug, long seasonNumber, long episodeNumber)
		{
			WatchItem episode = _libraryManager.GetWatchItem(showSlug, seasonNumber, episodeNumber);

			if (episode != null && System.IO.File.Exists(episode.Path))
				return PhysicalFile(episode.Path, "video/x-matroska", true);
			return NotFound();
		}

		[HttpGet("transmux/{showSlug}-s{seasonNumber}e{episodeNumber}")]
		public async Task<IActionResult> Transmux(string showSlug, long seasonNumber, long episodeNumber)
		{
			WatchItem episode = _libraryManager.GetWatchItem(showSlug, seasonNumber, episodeNumber);

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
			string path = Path.Combine(_transmuxPath, episodeLink);
			path = Path.Combine(path, "segments" + Path.DirectorySeparatorChar + chunk);

			return PhysicalFile(path, "video/MP2T");
		}

		[HttpGet("transcode/{showSlug}-s{seasonNumber}e{episodeNumber}")]
		public async Task<IActionResult> Transcode(string showSlug, long seasonNumber, long episodeNumber)
		{
			WatchItem episode = _libraryManager.GetWatchItem(showSlug, seasonNumber, episodeNumber);

			if (episode == null || !System.IO.File.Exists(episode.Path))
				return NotFound();
			string path = await _transcoder.Transcode(episode);
			if (path != null)
				return PhysicalFile(path, "application/x-mpegURL ", true);
			return StatusCode(500);
		}
	}
}