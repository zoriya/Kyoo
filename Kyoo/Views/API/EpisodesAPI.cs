using System;
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
		public Task<ActionResult<IEnumerable<Episode>>> GetEpisodesForSeason(string showSlug, int seasonNumber)
		{
			throw new NotImplementedException();
		}

		[HttpGet("{showSlug}/season/{seasonNumber}/episode/{episodeNumber}")]
		[Authorize(Policy="Read")]
		[JsonDetailed]
		public async Task<ActionResult<Episode>> GetEpisode(string showSlug, int seasonNumber, int episodeNumber)
		{
			Episode episode = await _libraryManager.GetEpisode(showSlug, seasonNumber, episodeNumber);

			if (episode == null)
				return NotFound();

			return episode;
		}
	}
}