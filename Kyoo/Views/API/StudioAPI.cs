using System.Collections.Generic;
using System.Linq;
using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.API
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
		
		public ActionResult<IEnumerable<Studio>> Index()
		{
			return _libraryManager.GetStudios().ToList();
		}
	}
}