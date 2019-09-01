using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.InternalAPI;
using Kyoo.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EpisodesController : ControllerBase
    {
        private readonly ILibraryManager libraryManager;

        public EpisodesController(ILibraryManager libraryManager)
        {
            this.libraryManager = libraryManager;
        }

        [HttpGet("{showSlug}/season/{seasonNumber}")]
        public ActionResult<IEnumerable<Episode>> GetEpisodesForSeason(string showSlug, long seasonNumber)
        {
            List<Episode> episodes = libraryManager.GetEpisodes(showSlug, seasonNumber);

            if(episodes == null)
                return NotFound();

            return episodes;
        }

        [HttpGet("{showSlug}/season/{seasonNumber}/episode/{episodeNumber}")]
        public ActionResult<Episode> GetEpisode(string showSlug, long seasonNumber, long episodeNumber)
        {
            Episode episode = libraryManager.GetEpisode(showSlug, seasonNumber, episodeNumber);

            if (episode == null)
                return NotFound();

            return episode;
        }
    }
}