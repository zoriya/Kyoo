using Kyoo.InternalAPI;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.IO;

namespace Kyoo.Controllers
{
    public class ThumbnailController : Controller
    {
        private readonly ILibraryManager libraryManager;
        private readonly string peoplePath;


        public ThumbnailController(ILibraryManager libraryManager, IConfiguration config)
        {
            this.libraryManager = libraryManager;
            peoplePath = config.GetValue<string>("peoplePath");
        }

        [HttpGet("poster/{showSlug}")]
        public IActionResult GetShowThumb(string showSlug)
        {
            string path = libraryManager.GetShowBySlug(showSlug)?.Path;
            if (path == null)
                return NotFound();

            string thumb = Path.Combine(path, "poster.jpg");

            if (System.IO.File.Exists(thumb))
                return new PhysicalFileResult(thumb, "image/jpg");
            else
                return NotFound();
        }

        [HttpGet("logo/{showSlug}")]
        public IActionResult GetShowLogo(string showSlug)
        {
            string path = libraryManager.GetShowBySlug(showSlug)?.Path;
            if (path == null)
                return NotFound();

            string thumb = Path.Combine(path, "logo.png");

            if (System.IO.File.Exists(thumb))
                return new PhysicalFileResult(thumb, "image/jpg");
            else
                return NotFound();
        }

        [HttpGet("backdrop/{showSlug}")]
        public IActionResult GetShowBackdrop(string showSlug)
        {
            string path = libraryManager.GetShowBySlug(showSlug)?.Path;
            if (path == null)
                return NotFound();

            string thumb = Path.Combine(path, "backdrop.jpg");

            if (System.IO.File.Exists(thumb))
                return new PhysicalFileResult(thumb, "image/jpg");
            else
                return NotFound();
        }

        [HttpGet("peopleimg/{peopleSlug}")]
        public IActionResult GetPeopleIcon(string peopleSlug)
        {
            string thumbPath = Path.Combine(peoplePath, peopleSlug + ".jpg");
            if (!System.IO.File.Exists(thumbPath))
                return NotFound();

            return new PhysicalFileResult(thumbPath, "image/jpg");
        }

        [HttpGet("thumb/{showSlug}-s{seasonNumber}e{episodeNumber}")]
        public IActionResult GetEpisodeThumb(string showSlug, long seasonNumber, long episodeNumber)
        {
            string path = libraryManager.GetEpisode(showSlug, seasonNumber, episodeNumber)?.Path;
            if (path == null)
                return NotFound();

            string thumb = Path.ChangeExtension(path, "jpg");

            if (System.IO.File.Exists(thumb))
                return new PhysicalFileResult(thumb, "image/jpg");
            return NotFound();
        }
    }
}
