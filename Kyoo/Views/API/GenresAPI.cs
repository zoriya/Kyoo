using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Api
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
		
		public async Task<ActionResult<IEnumerable<Genre>>> Index()
		{
			return (await _libraryManager.GetGenres()).ToList();
		}
	}
}