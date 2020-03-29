using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using Microsoft.AspNetCore.Authorization;

namespace Kyoo.Api
{
	[Route("api/[controller]")]
	[ApiController]
	public class CollectionController : ControllerBase
	{
		private readonly ILibraryManager _libraryManager;

		public CollectionController(ILibraryManager libraryManager)
		{
			_libraryManager = libraryManager;
		}

		[HttpGet("{collectionSlug}")]
		[Authorize(Policy="Read")]
		public ActionResult<Collection> GetShows(string collectionSlug)
		{
			Collection collection = _libraryManager.GetCollection(collectionSlug);

			if (collection == null)
				return NotFound();

			return collection;
		}
	}
}