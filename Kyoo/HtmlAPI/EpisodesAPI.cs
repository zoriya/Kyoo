using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;

namespace Kyoo.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EpisodesController : ControllerBase
    {
        private readonly ILibraryManager _libraryManager;

        public EpisodesController(ILibraryManager libraryManager)
        {
            _libraryManager = libraryManager;
        }

        [HttpGet("{showSlug}/season/{seasonNumber}")]
        public ActionResult<IEnumerable<Episode>> GetEpisodesForSeason(string showSlug, long seasonNumber)
        {
            IEnumerable<Episode> episodes = _libraryManager.GetEpisodes(showSlug, seasonNumber);

            if(episodes == null)
                return NotFound();

            return episodes.ToList();
        }

        [HttpGet("{showSlug}/season/{seasonNumber}/episode/{episodeNumber}")]
        public ActionResult<Episode> GetEpisode(string showSlug, long seasonNumber, long episodeNumber)
        {
            Episode episode = _libraryManager.GetEpisode(showSlug, seasonNumber, episodeNumber);

            if (episode == null)
                return NotFound();

            return episode;
        }
    }
}