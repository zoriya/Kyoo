using System;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.CommonApi;
using Kyoo.Controllers;
using Kyoo.Models.Exceptions;
using Kyoo.Models.Options;
using Kyoo.Models.Permissions;
using Microsoft.Extensions.Options;

namespace Kyoo.Api
{
	[Route("api/episode")]
	[Route("api/episodes")]
	[ApiController]
	[PartialPermission(nameof(EpisodeApi))]
	public class EpisodeApi : CrudApi<Episode>
	{
		private readonly ILibraryManager _libraryManager;
		private readonly IThumbnailsManager _thumbnails;
		private readonly IFileSystem _files;

		public EpisodeApi(ILibraryManager libraryManager,
			IOptions<BasicOptions> options,
			IFileSystem files,
			IThumbnailsManager thumbnails) 
			: base(libraryManager.EpisodeRepository, options.Value.PublicUrl)
		{
			_libraryManager = libraryManager;
			_files = files;
			_thumbnails = thumbnails;
		}

		[HttpGet("{episodeID:int}/show")]
		[PartialPermission(Kind.Read)]
		public async Task<ActionResult<Show>> GetShow(int episodeID)
		{
			Show ret =  await _libraryManager.GetOrDefault<Show>(x => x.Episodes.Any(y => y.ID  == episodeID));
			if (ret == null)
				return NotFound();
			return ret;
		}
		
		[HttpGet("{showSlug}-s{seasonNumber:int}e{episodeNumber:int}/show")]
		[PartialPermission(Kind.Read)]
		public async Task<ActionResult<Show>> GetShow(string showSlug, int seasonNumber, int episodeNumber)
		{
			Show ret = await _libraryManager.GetOrDefault<Show>(showSlug);
			if (ret == null)
				return NotFound();
			return ret;
		}
		
		[HttpGet("{showID:int}-{seasonNumber:int}e{episodeNumber:int}/show")]
		[PartialPermission(Kind.Read)]
		public async Task<ActionResult<Show>> GetShow(int showID, int seasonNumber, int episodeNumber)
		{
			Show ret = await _libraryManager.GetOrDefault<Show>(showID);
			if (ret == null)
				return NotFound();
			return ret;
		}
		
		[HttpGet("{episodeID:int}/season")]
		[PartialPermission(Kind.Read)]
		public async Task<ActionResult<Season>> GetSeason(int episodeID)
		{
			Season ret = await _libraryManager.GetOrDefault<Season>(x => x.Episodes.Any(y => y.ID == episodeID));
			if (ret == null)
				return NotFound();
			return ret;
		}
		
		[HttpGet("{showSlug}-s{seasonNumber:int}e{episodeNumber:int}/season")]
		[PartialPermission(Kind.Read)]
		public async Task<ActionResult<Season>> GetSeason(string showSlug, int seasonNumber, int episodeNumber)
		{
			try
			{
				return await _libraryManager.Get(showSlug, seasonNumber);
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
		}
		
		[HttpGet("{showID:int}-{seasonNumber:int}e{episodeNumber:int}/season")]
		[PartialPermission(Kind.Read)]
		public async Task<ActionResult<Season>> GetSeason(int showID, int seasonNumber, int episodeNumber)
		{
			try
			{
				return await _libraryManager.Get(showID, seasonNumber);
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
		}
		
		[HttpGet("{episodeID:int}/track")]
		[HttpGet("{episodeID:int}/tracks")]
		[PartialPermission(Kind.Read)]
		public async Task<ActionResult<Page<Track>>> GetEpisode(int episodeID,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30)
		{
			try
			{
				ICollection<Track> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere<Track>(where, x => x.Episode.ID == episodeID),
					new Sort<Track>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetOrDefault<Episode>(episodeID) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}
		
		[HttpGet("{showID:int}-s{seasonNumber:int}e{episodeNumber:int}/track")]
		[HttpGet("{showID:int}-s{seasonNumber:int}e{episodeNumber:int}/tracks")]
		[PartialPermission(Kind.Read)]
		public async Task<ActionResult<Page<Track>>> GetEpisode(int showID,
			int seasonNumber,
			int episodeNumber,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30)
		{
			try
			{
				ICollection<Track> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere<Track>(where, x => x.Episode.ShowID == showID 
					                                        && x.Episode.SeasonNumber == seasonNumber
					                                        && x.Episode.EpisodeNumber == episodeNumber),
					new Sort<Track>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetOrDefault(showID, seasonNumber, episodeNumber) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}
		
		[HttpGet("{slug}-s{seasonNumber:int}e{episodeNumber:int}/track")]
		[HttpGet("{slug}-s{seasonNumber:int}e{episodeNumber:int}/tracks")]
		[PartialPermission(Kind.Read)]
		public async Task<ActionResult<Page<Track>>> GetEpisode(string slug,
			int seasonNumber,
			int episodeNumber,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30)
		{
			try
			{
				ICollection<Track> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere<Track>(where, x => x.Episode.Show.Slug == slug 
						&& x.Episode.SeasonNumber == seasonNumber
						&& x.Episode.EpisodeNumber == episodeNumber),
					new Sort<Track>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetOrDefault(slug, seasonNumber, episodeNumber) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}
		
		[HttpGet("{id:int}/thumbnail")]
		[HttpGet("{id:int}/backdrop")]
		public async Task<IActionResult> GetThumb(int id)
		{
			try
			{
				Episode episode = await _libraryManager.Get<Episode>(id);
				return _files.FileResult(await _thumbnails.GetImagePath(episode, Images.Thumbnail));
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
		}
		
		[HttpGet("{slug}/thumbnail")]
		[HttpGet("{slug}/backdrop")]
		public async Task<IActionResult> GetThumb(string slug)
		{
			try
			{
				Episode episode = await _libraryManager.Get<Episode>(slug);
				return _files.FileResult(await _thumbnails.GetImagePath(episode, Images.Thumbnail));
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
		}
	}
}