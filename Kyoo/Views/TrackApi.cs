using System.Linq;
using System.Threading.Tasks;
using Kyoo.CommonApi;
using Kyoo.Controllers;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Kyoo.Models.Options;
using Kyoo.Models.Permissions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Kyoo.Api
{
	[Route("api/track")]
	[Route("api/tracks")]
	[ApiController]
	[PartialPermission(nameof(Track))]
	public class TrackApi : CrudApi<Track>
	{
		private readonly ILibraryManager _libraryManager;

		public TrackApi(ILibraryManager libraryManager, IOptions<BasicOptions> options)
			: base(libraryManager.TrackRepository, options.Value.PublicUrl)
		{
			_libraryManager = libraryManager;
		}

		[HttpGet("{id:int}/episode")]
		[PartialPermission(Kind.Read)]
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
		[PartialPermission(Kind.Read)]
		public async Task<ActionResult<Episode>> GetEpisode(string slug)
		{
			try
			{
				return await _libraryManager.Get<Episode>(x => x.Tracks.Any(y => y.Slug == slug));
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
		}
	}
}