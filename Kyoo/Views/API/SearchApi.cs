using System.Collections.Generic;
using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Api
{
	[Route("api/search")]
	[ApiController]
	public class SearchApi : ControllerBase
	{
		private readonly ILibraryManager _libraryManager;

		public SearchApi(ILibraryManager libraryManager)
		{
			_libraryManager = libraryManager;
		}

		[HttpGet("{query}")]
		[Authorize(Policy="Read")]
		public async Task<ActionResult<SearchResult>> Search(string query)
		{
			return new SearchResult
			{
				Query = query,
				Collections = await _libraryManager.SearchCollections(query),
				Shows = await _libraryManager.SearchShows(query),
				Episodes = await _libraryManager.SearchEpisodes(query),
				People = await _libraryManager.SearchPeople(query),
				Genres = await _libraryManager.SearchGenres(query),
				Studios = await _libraryManager.SearchStudios(query)
			};
		}
		
		[HttpGet("{query}/collection")]
		[HttpGet("{query}/collections")]
		[Authorize(Policy="Read")]
		public Task<ICollection<Collection>> SearchCollections(string query)
		{
			return _libraryManager.SearchCollections(query);
		}
		
		[HttpGet("{query}/show")]
		[HttpGet("{query}/shows")]
		[Authorize(Policy="Read")]
		public Task<ICollection<Show>> SearchShows(string query)
		{
			return _libraryManager.SearchShows(query);
		}
		
		[HttpGet("{query}/episode")]
		[HttpGet("{query}/episodes")]
		[Authorize(Policy="Read")]
		public Task<ICollection<Episode>> SearchEpisodes(string query)
		{
			return _libraryManager.SearchEpisodes(query);
		}
		
		[HttpGet("{query}/people")]
		[Authorize(Policy="Read")]
		public Task<ICollection<People>> SearchPeople(string query)
		{
			return _libraryManager.SearchPeople(query);
		}
		
		[HttpGet("{query}/genre")]
		[HttpGet("{query}/genres")]
		[Authorize(Policy="Read")]
		public Task<ICollection<Genre>> SearchGenres(string query)
		{
			return _libraryManager.SearchGenres(query);
		}
		
		[HttpGet("{query}/studio")]
		[HttpGet("{query}/studios")]
		[Authorize(Policy="Read")]
		public Task<ICollection<Studio>> SearchStudios(string query)
		{
			return _libraryManager.SearchStudios(query);
		}
	}
}