using Kyoo.InternalAPI;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VideoController : ControllerBase
    {
        private readonly ILibraryManager libraryManager;
        private readonly ITranscoder transcoder;

        public VideoController(ILibraryManager libraryManager, ITranscoder transcoder)
        {
            this.libraryManager = libraryManager;
            this.transcoder = transcoder;
        }

        [HttpGet("{showSlug}-s{seasonNumber}e{episodeNumber}")]
        public IActionResult Index(string showSlug, long seasonNumber, long episodeNumber)
        {
            WatchItem episode = libraryManager.GetWatchItem(showSlug, seasonNumber, episodeNumber);

            if (episode != null && System.IO.File.Exists(episode.Path))
                return PhysicalFile(episode.Path, "video/x-matroska", true);
            else
                return NotFound();
        }

        [HttpGet("transmux/{showSlug}-s{seasonNumber}e{episodeNumber}")]
        public IActionResult Transmux(string showSlug, long seasonNumber, long episodeNumber)
        {
            WatchItem episode = libraryManager.GetWatchItem(showSlug, seasonNumber, episodeNumber);

            if (episode != null && System.IO.File.Exists(episode.Path))
            {
                string path = transcoder.Transmux(episode);
                if (path != null)
                    return PhysicalFile(path, "video/mp4", true);
                else
                    return StatusCode(500);
            }
            else
                return NotFound();
        }

        [HttpGet("transcode/{showSlug}-s{seasonNumber}e{episodeNumber}")]
        public IActionResult Transcode(string showSlug, long seasonNumber, long episodeNumber)
        {
            WatchItem episode = libraryManager.GetWatchItem(showSlug, seasonNumber, episodeNumber);

            if (episode != null && System.IO.File.Exists(episode.Path))
            {
                string path = transcoder.Transcode(episode.Path);
                return PhysicalFile(path, "video/mp4", true); //Should use mpeg dash
            }
            else
                return NotFound();
        }
    }
}