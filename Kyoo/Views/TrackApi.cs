using System.Linq;
using System.Threading.Tasks;
using Kyoo.CommonApi;
using Kyoo.Controllers;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace Kyoo.Api
{
	[Route("api/track")]
	[Route("api/tracks")]
	[ApiController]
	public class TrackApi : CrudApi<Track>
	{
		private readonly ILibraryManager _libraryManager;

		public TrackApi(ILibraryManager libraryManager, IConfiguration configuration)
			: base(libraryManager.TrackRepository, configuration)
		{
			_libraryManager = libraryManager;
		}

		[HttpGet("{id:int}/episode")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Episode>> GetEpisode(int id)
		{
			try
			{
				return await _libraryManager.Get<Episode>(x => x.Tracks.Any(y => y.ID == id));
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
		}
		
		[HttpGet("{slug}/episode")]
		[Authorize(Policy = "Read")]
		public async Task<ActionResult<Episode>> GetEpisode(string slug)
		{
			try
			{
				// TODO This won't work with the local repository implementation.
				// TODO Implement something like this (a dotnet-ef's QueryCompilationContext): https://stackoverflow.com/questions/62687811/how-can-i-convert-a-custom-function-to-a-sql-expression-for-entity-framework-cor
				return await _libraryManager.Get<Episode>(x => x.Tracks.Any(y => y.Slug == slug));
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
		}
	}
}