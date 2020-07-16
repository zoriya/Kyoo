using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.API
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
		public async Task<ActionResult<SearchResult>> Search(string query)
		{
			SearchResult result = new SearchResult
			{
				Query = query,
				Collections = await _libraryManager.SearchCollections(query),
				Shows = await _libraryManager.SearchShows(query),
				Episodes = await _libraryManager.SearchEpisodes(query),
				People = await _libraryManager.SearchPeople(query),
				Genres = await _libraryManager.SearchGenres(query),
				Studios = await _libraryManager.SearchStudios(query)
			};
			return result;
		}
	}
}