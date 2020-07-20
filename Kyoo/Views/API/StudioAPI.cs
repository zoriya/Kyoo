using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Api
{
	[Route("api/studios")]
	[Route("api/studio")]
	[ApiController]
	public class StudioAPI : ControllerBase
	{
		private readonly ILibraryManager _libraryManager;

		public StudioAPI(ILibraryManager libraryManager)
		{
			_libraryManager = libraryManager;
		}
		
		public async Task<ActionResult<IEnumerable<Studio>>> Index()
		{
			return (await _libraryManager.GetStudios()).ToList();
		}
	}
}