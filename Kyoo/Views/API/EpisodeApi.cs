using System;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.CommonApi;
using Kyoo.Controllers;
using Kyoo.Models.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;

namespace Kyoo.Api
{
	[Route("api/episode")]
	[Route("api/episodes")]
	[ApiController]
	public class EpisodeApi : CrudApi<Episode>
	{
		private readonly ILibraryManager _libraryManager;

		public EpisodeApi(ILibraryManager libraryManager, IConfiguration configuration) 
			: base(libraryManager.EpisodeRepository, configuration)
		{
			_libraryManager = libraryManager;
		}

		[HttpGet("{episodeID:int}/show")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Show>> GetShow(int episodeID)
		{
			return await _libraryManager.GetShow(x => x.Episodes.Any(y => y.ID  == episodeID));
		}
		
		[HttpGet("{showSlug}-s{seasonNumber:int}e{episodeNumber:int}/show")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Show>> GetShow(string showSlug)
		{
			return await _libraryManager.GetShow(showSlug);
		}
		
		[HttpGet("{showID:int}-{seasonNumber:int}e{episodeNumber:int}/show")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Show>> GetShow(int showID, int _)
		{
			return await _libraryManager.GetShow(showID);
		}
		
		[HttpGet("{episodeID:int}/season")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Season>> GetSeason(int episodeID)
		{
			return await _libraryManager.GetSeason(x => x.Episodes.Any(y => y.ID == episodeID));
		}
		
		[HttpGet("{showSlug}-s{seasonNumber:int}e{episodeNumber:int}/season")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Season>> GetSeason(string showSlug, int seasonNuber)
		{
			return await _libraryManager.GetSeason(showSlug, seasonNuber);
		}
		
		[HttpGet("{showID:int}-{seasonNumber:int}e{episodeNumber:int}/season")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Season>> GetSeason(int showID, int seasonNumber)
		{
			return await _libraryManager.GetSeason(showID, seasonNumber);
		}
		
		[HttpGet("{episodeID:int}/track")]
		[HttpGet("{episodeID:int}/tracks")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Track>>> GetEpisode(int episodeID,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30)
		{
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Track> resources = await _libraryManager.GetTracks(
					ApiHelper.ParseWhere<Track>(where, x => x.Episode.ID == episodeID),
					new Sort<Track>(sortBy),
					new Pagination(limit, afterID));

				return Page(resources, limit);
			}
			catch (ItemNotFound)
			{
				return NotFound();
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}
		
		[HttpGet("{showID:int}-s{seasonNumber:int}e{episodeNumber:int}/track")]
		[HttpGet("{showID:int}-s{seasonNumber:int}e{episodeNumber:int}/tracks")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Track>>> GetEpisode(int showID,
			int seasonNumber,
			int episodeNumber,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30)
		{
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Track> resources = await _libraryManager.GetTracks(
					ApiHelper.ParseWhere<Track>(where, x => x.Episode.ShowID == showID 
					                                        && x.Episode.SeasonNumber == seasonNumber
					                                        && x.Episode.EpisodeNumber == episodeNumber),
					new Sort<Track>(sortBy),
					new Pagination(limit, afterID));

				return Page(resources, limit);
			}
			catch (ItemNotFound)
			{
				return NotFound();
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}
		
		[HttpGet("{showSlug}-s{seasonNumber:int}e{episodeNumber:int}/track")]
		[HttpGet("{showSlug}-s{seasonNumber:int}e{episodeNumber:int}/tracks")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Track>>> GetEpisode(string showSlug,
			int seasonNumber,
			int episodeNumber,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30)
		{
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Track> resources = await _libraryManager.GetTracks(ApiHelper.ParseWhere<Track>(where, x => x.Episode.Show.Slug == showSlug 
						&& x.Episode.SeasonNumber == seasonNumber
						&& x.Episode.EpisodeNumber == episodeNumber),
					new Sort<Track>(sortBy),
					new Pagination(limit, afterID));

				return Page(resources, limit);
			}
			catch (ItemNotFound)
			{
				return NotFound();
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}
	}
}