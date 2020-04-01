using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.IO;
using Kyoo.Controllers;
using Microsoft.AspNetCore.Authorization;

namespace Kyoo.Api
{
	public class ThumbnailController : ControllerBase
	{
		private readonly ILibraryManager _libraryManager;
		private readonly string _peoplePath;


		public ThumbnailController(ILibraryManager libraryManager, IConfiguration config)
		{
			_libraryManager = libraryManager;
			_peoplePath = config.GetValue<string>("peoplePath");
		}

		[HttpGet("poster/{showSlug}")]
		public IActionResult GetShowThumb(string showSlug)
		{
			string path = _libraryManager.GetShowBySlug(showSlug)?.Path;
			if (path == null)
				return NotFound();

			string thumb = Path.Combine(path, "poster.jpg");

			if (System.IO.File.Exists(thumb))
				return new PhysicalFileResult(Path.GetFullPath(thumb), "image/jpg");
			return NotFound();
		}

		[HttpGet("logo/{showSlug}")]
		public IActionResult GetShowLogo(string showSlug)
		{
			string path = _libraryManager.GetShowBySlug(showSlug)?.Path;
			if (path == null)
				return NotFound();

			string thumb = Path.Combine(path, "logo.png");

			if (System.IO.File.Exists(thumb))
				return new PhysicalFileResult(Path.GetFullPath(thumb), "image/jpg");
			return NotFound();
		}

		[HttpGet("backdrop/{showSlug}")]
		public IActionResult GetShowBackdrop(string showSlug)
		{
			string path = _libraryManager.GetShowBySlug(showSlug)?.Path;
			if (path == null)
				return NotFound();

			string thumb = Path.Combine(path, "backdrop.jpg");

			if (System.IO.File.Exists(thumb))
				return new PhysicalFileResult(Path.GetFullPath(thumb), "image/jpg");
			return NotFound();
		}

		[HttpGet("peopleimg/{peopleSlug}")]
		public IActionResult GetPeopleIcon(string peopleSlug)
		{
			string thumbPath = Path.Combine(_peoplePath, peopleSlug + ".jpg");
			if (!System.IO.File.Exists(thumbPath))
				return NotFound();

			return new PhysicalFileResult(Path.GetFullPath(thumbPath), "image/jpg");
		}

		[HttpGet("thumb/{showSlug}-s{seasonNumber}e{episodeNumber}")]
		public IActionResult GetEpisodeThumb(string showSlug, long seasonNumber, long episodeNumber)
		{
			string path = _libraryManager.GetEpisode(showSlug, seasonNumber, episodeNumber)?.Path;
			if (path == null)
				return NotFound();

			string thumb = Path.ChangeExtension(path, "jpg");

			if (System.IO.File.Exists(thumb))
				return new PhysicalFileResult(Path.GetFullPath(thumb), "image/jpg");
			return NotFound();
		}
	}
}
