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

        [HttpGet("{showSlug}-s{seasonNumber}e{episodeNumber}-{languageTag}.{codec?}")]
        public IActionResult GetSubtitle(string showSlug, long seasonNumber, long episodeNumber, string languageTag, string codec)
        {
            Track subtitle = libraryManager.GetSubtitle(showSlug, seasonNumber, episodeNumber, languageTag, false);

            if (subtitle == null)
                return NotFound();

            //Should use appropriate mime type here
            return PhysicalFile(subtitle.Path, "text/x-ssa");
        }

        //This one is never called.
        [HttpGet("{showSlug}-s{seasonNumber}e{episodeNumber}-{languageTag}-{disposition}.{codec?}")] //Disposition can't be tagged as optional because there is a parametter after him.
        public IActionResult GetForcedSubtitle(string showSlug, long seasonNumber, long episodeNumber, string languageTag, string disposition, string codec)
        {
            Track subtitle = libraryManager.GetSubtitle(showSlug, seasonNumber, episodeNumber, languageTag, disposition == "forced");

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