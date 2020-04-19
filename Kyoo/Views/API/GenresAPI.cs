using System.Collections.Generic;
using System.Linq;
using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.API
{
	[Route("api/genres")]
	[Route("api/genre")]
	[ApiController]
	public class GenresAPI : ControllerBase
	{
		private readonly ILibraryManager _libraryManager;

		public GenresAPI(ILibraryManager libraryManager)
		{
			_libraryManager = libraryManager;
		}
		
		public ActionResult<IEnumerable<Genre>> Index()
		{
			return _libraryManager.GetGenres().ToList();
		}
	}
}