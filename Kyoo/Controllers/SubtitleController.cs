using Kyoo.InternalAPI;
using Kyoo.Models.Watch;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SubtitleController : ControllerBase
    {
        private readonly ILibraryManager libraryManager;

        public SubtitleController(ILibraryManager libraryManager)
        {
            this.libraryManager = libraryManager;
        }

        [HttpGet("{showSlug}-s{seasonNumber}e{episodeNumber}-{languageTag}.{format?}")]
        public IActionResult GetSubtitle(string showSlug, long seasonNumber, long episodeNumber, string languageTag, string format)
        {
            Stream subtitle = libraryManager.GetSubtitle(showSlug, seasonNumber, episodeNumber, languageTag);

            if (subtitle == null)
                return NotFound();

            //Should use appropriate mime type here
            return PhysicalFile(subtitle.Path, "text/x-ssa");
        }
    }
}