using System;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.CommonApi;
using Kyoo.Controllers;
using Kyoo.Models.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;

namespace Kyoo.Api
{
	[Route("api/show")]
	[Route("api/shows")]
	[ApiController]
	public class ShowApi : CrudApi<Show>
	{
		private readonly ILibraryManager _libraryManager;
		private readonly IFileManager _files;
		private readonly IThumbnailsManager _thumbs;

		public ShowApi(ILibraryManager libraryManager,
			IFileManager files, 
			IThumbnailsManager thumbs,
			IConfiguration configuration)
			: base(libraryManager.ShowRepository, configuration)
		{
			_libraryManager = libraryManager;
			_files = files;
			_thumbs = thumbs;
		}

		[HttpGet("{showID:int}/season")]
		[HttpGet("{showID:int}/seasons")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Season>>> GetSeasons(int showID,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 20)
		{
			try
			{
				ICollection<Season> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere<Season>(where, x => x.ShowID == showID),
					new Sort<Season>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.Get<Show>(showID) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}

		[HttpGet("{slug}/season")]
		[HttpGet("{slug}/seasons")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Season>>> GetSeasons(string slug,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 20)
		{
			try
			{
				ICollection<Season> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere<Season>(where, x => x.Show.Slug == slug),
					new Sort<Season>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.Get<Show>(slug) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}
		
		[HttpGet("{showID:int}/episode")]
		[HttpGet("{showID:int}/episodes")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Episode>>> GetEpisodes(int showID,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 50)
		{
			try
			{
				ICollection<Episode> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere<Episode>(where, x => x.ShowID == showID),
					new Sort<Episode>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.Get<Show>(showID) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}

		[HttpGet("{slug}/episode")]
		[HttpGet("{slug}/episodes")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Episode>>> GetEpisodes(string slug,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 50)
		{
			try
			{
				ICollection<Episode> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere<Episode>(where, x => x.Show.Slug == slug),
					new Sort<Episode>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.Get<Show>(slug) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}
		
		[HttpGet("{showID:int}/people")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<PeopleRole>>> GetPeople(int showID,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30)
		{
			try
			{
				ICollection<PeopleRole> resources = await _libraryManager.GetPeopleFromShow(showID,
					ApiHelper.ParseWhere<PeopleRole>(where),
					new Sort<PeopleRole>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.Get<Show>(showID) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}

		[HttpGet("{slug}/people")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<PeopleRole>>> GetPeople(string slug,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30)
		{
			try
			{
				ICollection<PeopleRole> resources = await _libraryManager.GetPeopleFromShow(slug,
					ApiHelper.ParseWhere<PeopleRole>(where),
					new Sort<PeopleRole>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.Get<Show>(slug) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}
		
		[HttpGet("{showID:int}/genre")]
		[HttpGet("{showID:int}/genres")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Genre>>> GetGenres(int showID,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30)
		{
			try
			{
				ICollection<Genre> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere<Genre>(where, x => x.Shows.Any(y => y.ID == showID)),
					new Sort<Genre>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.Get<Show>(showID) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}

		[HttpGet("{slug}/genre")]
		[HttpGet("{slug}/genres")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Genre>>> GetGenre(string slug,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30)
		{
			try
			{
				ICollection<Genre> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere<Genre>(where, x => x.Shows.Any(y => y.Slug == slug)),
					new Sort<Genre>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.Get<Show>(slug) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}
		
		[HttpGet("{showID:int}/studio")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Studio>> GetStudio(int showID)
		{
			try
			{
				return await _libraryManager.Get<Studio>(x => x.Shows.Any(y => y.ID == showID));
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
		}

		[HttpGet("{slug}/studio")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Studio>> GetStudio(string slug)
		{
			try
			{
				return await _libraryManager.Get<Studio>(x => x.Shows.Any(y => y.Slug == slug));
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
		}
		
		[HttpGet("{showID:int}/library")]
		[HttpGet("{showID:int}/libraries")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Library>>> GetLibraries(int showID,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30)
		{
			try
			{
				ICollection<Library> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere<Library>(where, x => x.Shows.Any(y => y.ID == showID)),
					new Sort<Library>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.Get<Show>(showID) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}

		[HttpGet("{slug}/library")]
		[HttpGet("{slug}/libraries")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Library>>> GetLibraries(string slug,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30)
		{
			try
			{
				ICollection<Library> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere<Library>(where, x => x.Shows.Any(y => y.Slug == slug)),
					new Sort<Library>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.Get<Show>(slug) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}
		
		[HttpGet("{showID:int}/collection")]
		[HttpGet("{showID:int}/collections")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Collection>>> GetCollections(int showID,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30)
		{
			try
			{
				ICollection<Collection> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere<Collection>(where, x => x.Shows.Any(y => y.ID == showID)),
					new Sort<Collection>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.Get<Show>(showID) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}

		[HttpGet("{slug}/collection")]
		[HttpGet("{slug}/collections")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Page<Collection>>> GetCollections(string slug,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30)
		{
			try
			{
				ICollection<Collection> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere<Collection>(where, x => x.Shows.Any(y => y.Slug == slug)),
					new Sort<Collection>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.Get<Show>(slug) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new {Error = ex.Message});
			}
		}

		[HttpGet("{slug}/font")]
		[HttpGet("{slug}/fonts")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Dictionary<string, string>>> GetFonts(string slug)
		{
			try
			{
				Show show = await _libraryManager.Get<Show>(slug);
				string path = Path.Combine(_files.GetExtraDirectory(show), "Attachments");
				return (await _files.ListFiles(path))
					.ToDictionary(Path.GetFileNameWithoutExtension,
						x => $"{BaseURL}/api/shows/{slug}/fonts/{Path.GetFileName(x)}");
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
		}
		
		[HttpGet("{showSlug}/font/{slug}")]
		[HttpGet("{showSlug}/fonts/{slug}")]
		[Authorize(Policy = "Read")]
		public async Task<IActionResult> GetFont(string showSlug, string slug)
		{
			try
			{
				Show show = await _libraryManager.Get<Show>(showSlug);
				string path = Path.Combine(_files.GetExtraDirectory(show), "Attachments", slug);
				return _files.FileResult(path);
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
		}

		[HttpGet("{slug}/poster")]
		[Authorize(Policy = "Read")]
		public async Task<IActionResult> GetPoster(string slug)
		{
			try
			{
				Show show = await _libraryManager.Get<Show>(slug);
				return _files.FileResult(await _thumbs.GetShowPoster(show));
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
		}
		
		[HttpGet("{slug}/logo")]
		[Authorize(Policy="Read")]
		public async Task<IActionResult> GetLogo(string slug)
		{
			try
			{
				Show show = await _libraryManager.Get<Show>(slug);
				return _files.FileResult(await _thumbs.GetShowLogo(show));
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
		}
		
		[HttpGet("{slug}/backdrop")]
		[Authorize(Policy="Read")]
		public async Task<IActionResult> GetBackdrop(string slug)
		{
			try
			{
				Show show = await _libraryManager.Get<Show>(slug);
				return _files.FileResult(await _thumbs.GetShowBackdrop(show));
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
		}
	}
}
