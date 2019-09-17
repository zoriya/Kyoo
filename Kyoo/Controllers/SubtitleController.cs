using Kyoo.InternalAPI;
using Kyoo.Models;
using Kyoo.Models.Watch;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace Kyoo.Controllers
{
    [Route("api/[controller]")]
    //[ApiController]
    public class SubtitleController : ControllerBase
    {
        private readonly ILibraryManager libraryManager;
        private readonly ITranscoder transcoder;

        public SubtitleController(ILibraryManager libraryManager, ITranscoder transcoder)
        {
            this.libraryManager = libraryManager;
            this.transcoder = transcoder;
        }

        [HttpGet("{showSlug}-s{seasonNumber:int}e{episodeNumber:int}.{identifier}.{codec?}")]
        public IActionResult GetSubtitle(string showSlug, int seasonNumber, int episodeNumber, string identifier, string codec)
        {
            string languageTag = identifier.Substring(0, 3);
            bool forced = identifier.Length > 3 && identifier.Substring(4) == "forced";

            Track subtitle = libraryManager.GetSubtitle(showSlug, seasonNumber, episodeNumber, languageTag, forced);

            if (subtitle == null)
                return NotFound();

            string mime = "text/vtt";
            if (subtitle.Codec == "ass")
                mime = "text/x-ssa";
            else if (subtitle.Codec == "subrip")
                mime = "application/x-subrip";

            //Should use appropriate mime type here
            return PhysicalFile(subtitle.Path, mime);
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