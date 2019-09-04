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
            {
                //Should check if video is playable on the client and transcode if needed.
                //Should use the right mime type
                return new PhysicalFileResult(episode.Path, "video/mp4");
            }
            else
                return NotFound();
        }
    }
}