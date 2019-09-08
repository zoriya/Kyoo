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

            if (System.IO.File.Exists(episode.Path))
                return PhysicalFile(episode.Path, "video/x-matroska", true);
            else
                return NotFound();
        }

        [HttpGet("{showSlug}-s{seasonNumber}e{episodeNumber}/stream")]
        public IActionResult Stream(string showSlug, long seasonNumber, long episodeNumber)
        {
            WatchItem episode = libraryManager.GetWatchItem(showSlug, seasonNumber, episodeNumber);

            if (System.IO.File.Exists(episode.Path))
            {
                string path = transcoder.Stream(episode.Path);
                return PhysicalFile(path, "video/mp4", true);
            }
            else
                return NotFound();
        }

        [HttpGet("{showSlug}-s{seasonNumber}e{episodeNumber}/transcode")]
        public IActionResult Transcode(string showSlug, long seasonNumber, long episodeNumber)
        {
            WatchItem episode = libraryManager.GetWatchItem(showSlug, seasonNumber, episodeNumber);

            if (System.IO.File.Exists(episode.Path))
            {
                string path = transcoder.Transcode(episode.Path);
                return PhysicalFile(path, "video/mp4", true);
            }
            else
                return NotFound();
        }
    }
}