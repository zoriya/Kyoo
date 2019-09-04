using Kyoo.InternalAPI;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

// For more information on enabling MVC for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Kyoo.Controllers
{
    [Route("api/[controller]")]
    public class WatchController : Controller
    {
        private readonly ILibraryManager libraryManager;
        private readonly ITranscoder transcoder;

        public WatchController(ILibraryManager libraryManager, ITranscoder transcoder)
        {
            this.libraryManager = libraryManager;
            this.transcoder = transcoder;
        }


        [HttpGet("{showSlug}-s{seasonNumber}e{episodeNumber}")]
        public IActionResult Index(string showSlug, long seasonNumber, long episodeNumber)
        {
            Debug.WriteLine("&Trying to watch " + showSlug + " season " + seasonNumber + " episode " + episodeNumber);

            Episode episode = libraryManager.GetEpisode(showSlug, seasonNumber, episodeNumber);

            Debug.WriteLine("&Transcoding at: " + episode.Path);
            transcoder.GetVideo(episode.Path);

            return NotFound();
        }
    }
}
