using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Api
{
	[Route("api/[controller]")]
	[ApiController]
	public class SearchController : ControllerBase
	{
		private readonly ILibraryManager _libraryManager;

		public SearchController(ILibraryManager libraryManager)
		{
			_libraryManager = libraryManager;
		}

		[HttpGet("{query}")]
		[Authorize(Policy="Read")]
		public ActionResult<SearchResult> Search(string query)
		{
			SearchResult result = new SearchResult
			{
				Query = query,
				Collections = _libraryManager.SearchCollections(query),
				Shows = _libraryManager.SearchShows(query),
				Episodes = _libraryManager.SearchEpisodes(query),
				People = _libraryManager.SearchPeople(query),
				Genres = _libraryManager.SearchGenres(query),
				Studios = _libraryManager.SearchStudios(query)
			};
			return result;
		}
	}
}