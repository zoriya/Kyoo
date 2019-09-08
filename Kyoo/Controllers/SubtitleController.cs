using Kyoo.InternalAPI;
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

        [HttpGet("{showSlug}-s{seasonNumber}e{episodeNumber}-{languageTag}.ass")]
        public IActionResult GetSubtitle(string showSlug, long seasonNumber, long episodeNumber, string languageTag)
        {
            return PhysicalFile(@"D:\Videos\Devilman\Subtitles\fre\Devilman Crybaby S01E01.fre.ass", "text/x-ssa");
        }
    }
}