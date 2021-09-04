using System;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Exceptions;
using Kyoo.Abstractions.Models.Permissions;
using Kyoo.Core.Models.Options;
using Microsoft.Extensions.Options;

namespace Kyoo.Core.Api
{
	[Route("api/show")]
	[Route("api/shows")]
	[Route("api/movie")]
	[Route("api/movies")]
	[ApiController]
	[PartialPermission(nameof(ShowApi))]
	public class ShowApi : CrudApi<Show>
	{
		private readonly ILibraryManager _libraryManager;
		private readonly IFileSystem _files;
		private readonly IThumbnailsManager _thumbs;

		public ShowApi(ILibraryManager libraryManager,
			IFileSystem files,
			IThumbnailsManager thumbs,
			IOptions<BasicOptions> options)
			: base(libraryManager.ShowRepository, options.Value.PublicUrl)
		{
			_libraryManager = libraryManager;
			_files = files;
			_thumbs = thumbs;
		}

		[HttpGet("{showID:int}/season")]
		[HttpGet("{showID:int}/seasons")]
		[PartialPermission(Kind.Read)]
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

				if (!resources.Any() && await _libraryManager.GetOrDefault<Show>(showID) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new { Error = ex.Message });
			}
		}

		[HttpGet("{slug}/season")]
		[HttpGet("{slug}/seasons")]
		[PartialPermission(Kind.Read)]
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

				if (!resources.Any() && await _libraryManager.GetOrDefault<Show>(slug) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new { Error = ex.Message });
			}
		}

		[HttpGet("{showID:int}/episode")]
		[HttpGet("{showID:int}/episodes")]
		[PartialPermission(Kind.Read)]
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

				if (!resources.Any() && await _libraryManager.GetOrDefault<Show>(showID) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new { Error = ex.Message });
			}
		}

		[HttpGet("{slug}/episode")]
		[HttpGet("{slug}/episodes")]
		[PartialPermission(Kind.Read)]
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

				if (!resources.Any() && await _libraryManager.GetOrDefault<Show>(slug) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new { Error = ex.Message });
			}
		}

		[HttpGet("{showID:int}/people")]
		[PartialPermission(Kind.Read)]
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

				if (!resources.Any() && await _libraryManager.GetOrDefault<Show>(showID) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new { Error = ex.Message });
			}
		}

		[HttpGet("{slug}/people")]
		[PartialPermission(Kind.Read)]
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

				if (!resources.Any() && await _libraryManager.GetOrDefault<Show>(slug) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new { Error = ex.Message });
			}
		}

		[HttpGet("{showID:int}/genre")]
		[HttpGet("{showID:int}/genres")]
		[PartialPermission(Kind.Read)]
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

				if (!resources.Any() && await _libraryManager.GetOrDefault<Show>(showID) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new { Error = ex.Message });
			}
		}

		[HttpGet("{slug}/genre")]
		[HttpGet("{slug}/genres")]
		[PartialPermission(Kind.Read)]
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

				if (!resources.Any() && await _libraryManager.GetOrDefault<Show>(slug) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new { Error = ex.Message });
			}
		}

		[HttpGet("{showID:int}/studio")]
		[PartialPermission(Kind.Read)]
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
		[PartialPermission(Kind.Read)]
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
		[PartialPermission(Kind.Read)]
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

				if (!resources.Any() && await _libraryManager.GetOrDefault<Show>(showID) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new { Error = ex.Message });
			}
		}

		[HttpGet("{slug}/library")]
		[HttpGet("{slug}/libraries")]
		[PartialPermission(Kind.Read)]
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

				if (!resources.Any() && await _libraryManager.GetOrDefault<Show>(slug) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new { Error = ex.Message });
			}
		}

		[HttpGet("{showID:int}/collection")]
		[HttpGet("{showID:int}/collections")]
		[PartialPermission(Kind.Read)]
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

				if (!resources.Any() && await _libraryManager.GetOrDefault<Show>(showID) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new { Error = ex.Message });
			}
		}

		[HttpGet("{slug}/collection")]
		[HttpGet("{slug}/collections")]
		[PartialPermission(Kind.Read)]
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

				if (!resources.Any() && await _libraryManager.GetOrDefault<Show>(slug) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new { Error = ex.Message });
			}
		}

		[HttpGet("{slug}/font")]
		[HttpGet("{slug}/fonts")]
		[PartialPermission(Kind.Read)]
		public async Task<ActionResult<Dictionary<string, string>>> GetFonts(string slug)
		{
			try
			{
				Show show = await _libraryManager.Get<Show>(slug);
				string path = _files.Combine(await _files.GetExtraDirectory(show), "Attachments");
				return (await _files.ListFiles(path))
					.ToDictionary(Path.GetFileNameWithoutExtension,
						x => $"{BaseURL}api/shows/{slug}/fonts/{Path.GetFileName(x)}");
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
		}

		[HttpGet("{showSlug}/font/{slug}")]
		[HttpGet("{showSlug}/fonts/{slug}")]
		[PartialPermission(Kind.Read)]
		public async Task<IActionResult> GetFont(string showSlug, string slug)
		{
			try
			{
				Show show = await _libraryManager.Get<Show>(showSlug);
				string path = _files.Combine(await _files.GetExtraDirectory(show), "Attachments", slug);
				return _files.FileResult(path);
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
		}

		[HttpGet("{slug}/poster")]
		public async Task<IActionResult> GetPoster(string slug)
		{
			try
			{
				Show show = await _libraryManager.Get<Show>(slug);
				return _files.FileResult(await _thumbs.GetImagePath(show, Images.Poster));
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
		}

		[HttpGet("{slug}/logo")]
		public async Task<IActionResult> GetLogo(string slug)
		{
			try
			{
				Show show = await _libraryManager.Get<Show>(slug);
				return _files.FileResult(await _thumbs.GetImagePath(show, Images.Logo));
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
		}

		[HttpGet("{slug}/backdrop")]
		[HttpGet("{slug}/thumbnail")]
		public async Task<IActionResult> GetBackdrop(string slug)
		{
			try
			{
				Show show = await _libraryManager.Get<Show>(slug);
				return _files.FileResult(await _thumbs.GetImagePath(show, Images.Thumbnail));
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
		}
	}
}
