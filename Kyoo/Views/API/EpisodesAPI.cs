using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Controllers;
using Microsoft.AspNetCore.Authorization;

namespace Kyoo.Api
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
		[Authorize(Policy="Read")]
		public async Task<ActionResult<IEnumerable<Episode>>> GetEpisodesForSeason(string showSlug, long seasonNumber)
		{
			IEnumerable<Episode> episodes = await _libraryManager.GetEpisodes(showSlug, seasonNumber);

			if(episodes == null)
				return NotFound();

			return episodes.ToList();
		}

		[HttpGet("{showSlug}/season/{seasonNumber}/episode/{episodeNumber}")]
		[Authorize(Policy="Read")]
		[JsonDetailed]
		public async Task<ActionResult<Episode>> GetEpisode(string showSlug, long seasonNumber, long episodeNumber)
		{
			Episode episode = await _libraryManager.GetEpisode(showSlug, seasonNumber, episodeNumber);

			if (episode == null)
				return NotFound();

			return episode;
		}
	}
}