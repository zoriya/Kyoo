using Kyoo.InternalAPI;
using Kyoo.Models;
using Kyoo.Models.Watch;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SubtitleController : ControllerBase
    {
        private readonly ILibraryManager libraryManager;
        private readonly ITranscoder transcoder;

        public SubtitleController(ILibraryManager libraryManager, ITranscoder transcoder)
        {
            this.libraryManager = libraryManager;
            this.transcoder = transcoder;
        }

        [HttpGet("{showSlug}-s{seasonNumber}e{episodeNumber}-{languageTag}.{format?}")]
        public IActionResult GetSubtitle(string showSlug, long seasonNumber, long episodeNumber, string languageTag, string format)
        {
            Track subtitle = libraryManager.GetSubtitle(showSlug, seasonNumber, episodeNumber, languageTag);

            if (subtitle == null)
                return NotFound();

            //Should use appropriate mime type here
            return PhysicalFile(subtitle.Path, "text/x-ssa");
        }

        [HttpGet("extract/{showSlug}-s{seasonNumber}e{episodeNumber}")]
        public string ExtractSubtitle(string showSlug, long seasonNumber, long episodeNumber)
        {
            Episode episode = libraryManager.GetEpisode(showSlug, seasonNumber, episodeNumber);
            transcoder.ExtractSubtitles(episode.Path);

            return "Processing...";
        }
    }
}