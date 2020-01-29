using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SearchController : ControllerBase
    {
        private readonly ILibraryManager libraryManager;

        public SearchController(ILibraryManager libraryManager)
        {
            this.libraryManager = libraryManager;
        }

        [HttpGet("{query}")]
        public ActionResult<SearchResult> Search(string query)
        {
            SearchResult result = new SearchResult
            {
                Query = query,
                Shows = libraryManager.GetShows(query),
                Episodes = libraryManager.SearchEpisodes(query),
                People = libraryManager.SearchPeople(query),
                Genres = libraryManager.SearchGenres(query),
                Studios = libraryManager.SearchStudios(query)
            };
            return result;
        }
    }
}