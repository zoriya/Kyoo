using Kyoo.InternalAPI;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.FileProviders;

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

        [HttpGet("backdrop/{showSlug}")]
        public IActionResult GetShowBackground(string showSlug)
        {
            string thumbPath = libraryManager.GetShowBySlug(showSlug)?.ImgBackdrop;
            if (thumbPath == null)
                return NotFound();

            return new PhysicalFileResult(thumbPath, "image/jpg");
        }
    }
}
