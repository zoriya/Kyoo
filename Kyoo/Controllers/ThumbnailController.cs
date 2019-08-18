using Kyoo.InternalAPI;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.FileProviders;

// For more information on enabling MVC for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

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
            string thumbPath = libraryManager.GetShowBySlug(showSlug).ImgPrimary;
            return new PhysicalFileResult(thumbPath, "image/jpg");
        }
    }
}
