using Kyoo.InternalAPI;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Controllers
{
    public class ThumbnailController : Controller
    {
        private ILibraryManager libraryManager;

        public ThumbnailController(ILibraryManager libraryManager)
        {
            this.libraryManager = libraryManager;
        }

        [HttpGet("thumb/{showSlug}")]
        public IActionResult GetShowThumb(string showSlug)
        {
            string thumbPath = libraryManager.GetShowBySlug(showSlug)?.ImgPrimary;
            if (thumbPath == null)
                return NotFound();

            return new PhysicalFileResult(thumbPath, "image/jpg");
        }

        [HttpGet("logo/{showSlug}")]
        public IActionResult GetShowLogo(string showSlug)
        {
            string thumbPath = libraryManager.GetShowBySlug(showSlug)?.ImgLogo;
            if (thumbPath == null)
                return NotFound();

            return new PhysicalFileResult(thumbPath, "image/png");
        }

        [HttpGet("backdrop/{showSlug}")]
        public IActionResult GetShowBackground(string showSlug)
        {
            string thumbPath = libraryManager.GetShowBySlug(showSlug)?.ImgBackdrop;
            if (thumbPath == null)
                return NotFound();

            return new PhysicalFileResult(thumbPath, "image/jpg");
        }

        [HttpGet("peopleimg/{peopleSlug}")]
        public IActionResult GetPeopleIcon(string peopleSlug)
        {
            string thumbPath = libraryManager.GetPeopleBySlug(peopleSlug)?.imgPrimary;
            if (thumbPath == null)
                return NotFound();

            return new PhysicalFileResult(thumbPath, "image/jpg");
        }

        [HttpGet("thumb/{showSlug}/s{seasonNumber}/e{episodeNumber}")]
        public IActionResult GetEpisodeThumb(string showSlug, long seasonNumber, long episodeNumber)
        {
            string thumbPath = libraryManager.GetEpisode(showSlug, seasonNumber, episodeNumber)?.ImgPrimary;
            if (thumbPath == null)
                return NotFound();

            return new PhysicalFileResult(thumbPath, "image/jpg");
        }
    }
}
