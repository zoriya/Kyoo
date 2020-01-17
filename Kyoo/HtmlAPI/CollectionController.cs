using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;

namespace Kyoo.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CollectionController : ControllerBase
    {
        private readonly ILibraryManager libraryManager;

        public CollectionController(ILibraryManager libraryManager)
        {
            this.libraryManager = libraryManager;
        }

        [HttpGet("{collectionSlug}")]
        public ActionResult<Collection> GetShows(string collectionSlug)
        {
            Collection collection = libraryManager.GetCollection(collectionSlug);

            if (collection == null)
                return NotFound();

            return collection;
        }
    }
}