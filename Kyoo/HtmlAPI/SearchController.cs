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
                query = query,
                shows = libraryManager.GetShows(query),
                episodes = libraryManager.SearchEpisodes(query),
                people = libraryManager.SearchPeople(query),
                genres = libraryManager.SearchGenres(query),
                studios = libraryManager.SearchStudios(query)
            };
            return result;
        }
    }
}