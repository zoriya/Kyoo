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
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.Configuration;

namespace Kyoo.Api
{
	[Route("api/show")]
	[Route("api/shows")]
	[ApiController]
	public class ShowApi : CrudApi<Show>
	{
		private readonly ILibraryManager _libraryManager;
		private FileExtensionContentTypeProvider _provider;

		public ShowApi(ILibraryManager libraryManager, IConfiguration configuration)
			: base(libraryManager.ShowRepository, configuration)
		{
			_libraryManager = libraryManager;
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
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Season> resources = await _libraryManager.GetSeasons(
					ApiHelper.ParseWhere<Season>(where, x => x.ShowID == showID),
					new Sort<Season>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetShow(showID) == null)
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
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Season> resources = await _libraryManager.GetSeasons(
					ApiHelper.ParseWhere<Season>(where, x => x.Show.Slug == slug),
					new Sort<Season>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetShow(slug) == null)
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
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Episode> resources = await _libraryManager.GetEpisodes(
					ApiHelper.ParseWhere<Episode>(where, x => x.ShowID == showID),
					new Sort<Episode>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetShow(showID) == null)
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
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Episode> resources = await _libraryManager.GetEpisodes(
					ApiHelper.ParseWhere<Episode>(where, x => x.Show.Slug == slug),
					new Sort<Episode>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetShow(slug) == null)
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
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<PeopleRole> resources = await _libraryManager.GetPeopleFromShow(showID,
					ApiHelper.ParseWhere<PeopleRole>(where),
					new Sort<PeopleRole>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetShow(showID) == null)
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
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<PeopleRole> resources = await _libraryManager.GetPeopleFromShow(slug,
					ApiHelper.ParseWhere<PeopleRole>(where),
					new Sort<PeopleRole>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetShow(slug) == null)
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
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Genre> resources = await _libraryManager.GetGenres(
					ApiHelper.ParseWhere<Genre>(where, x => x.Shows.Any(y => y.ID == showID)),
					new Sort<Genre>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetShow(showID) == null)
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
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Genre> resources = await _libraryManager.GetGenres(
					ApiHelper.ParseWhere<Genre>(where, x => x.Shows.Any(y => y.Slug == slug)),
					new Sort<Genre>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetShow(slug) == null)
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
				return await _libraryManager.GetStudio(x => x.Shows.Any(y => y.ID == showID));
			}
			catch (ItemNotFound)
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
				return await _libraryManager.GetStudio(x => x.Shows.Any(y => y.Slug == slug));
			}
			catch (ItemNotFound)
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
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Library> resources = await _libraryManager.GetLibraries(
					ApiHelper.ParseWhere<Library>(where, x => x.Shows.Any(y => y.ID == showID)),
					new Sort<Library>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetShow(showID) == null)
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
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Library> resources = await _libraryManager.GetLibraries(
					ApiHelper.ParseWhere<Library>(where, x => x.Shows.Any(y => y.Slug == slug)),
					new Sort<Library>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetShow(slug) == null)
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
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Collection> resources = await _libraryManager.GetCollections(
					ApiHelper.ParseWhere<Collection>(where, x => x.Shows.Any(y => y.ID == showID)),
					new Sort<Collection>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetShow(showID) == null)
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
			where.Remove("sortBy");
			where.Remove("limit");
			where.Remove("afterID");

			try
			{
				ICollection<Collection> resources = await _libraryManager.GetCollections(
					ApiHelper.ParseWhere<Collection>(where, x => x.Shows.Any(y => y.Slug == slug)),
					new Sort<Collection>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetShow(slug) == null)
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
			string path = (await _libraryManager.GetShow(slug))?.Path;
			if (path == null)
				return NotFound();
			return Directory.GetFiles(path)
				.ToDictionary(Path.GetFileNameWithoutExtension, x => $"{BaseURL}/shows/{slug}/fonts/{x}");
		}
		
		[HttpGet("{showSlug}/font/{slug}")]
		[HttpGet("{showSlug}/fonts/{slug}")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Dictionary<string, string>>> GetFont(string showSlug, string slug)
		{
			string path = (await _libraryManager.GetShow(showSlug))?.Path;
			if (path == null)
				return NotFound();
			string fontPath = Path.Combine(path, "Subtitles", "fonts", slug);
			if (!System.IO.File.Exists(fontPath))
				return NotFound();
			
			if (_provider == null)
				_provider = new FileExtensionContentTypeProvider();
			_provider.TryGetContentType(path, out string contentType);
			return PhysicalFile(fontPath, contentType ?? "application/x-font-ttf");
		}
	}
}
