using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace Kyoo.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PeopleController : ControllerBase
    {
        private readonly ILibraryManager libraryManager;

        public PeopleController(ILibraryManager libraryManager)
        {
            this.libraryManager = libraryManager;
        }

        [HttpGet("{peopleSlug}")]
        public ActionResult<Collection> GetPeople(string peopleSlug)
        {
            People people = libraryManager.GetPeopleBySlug(peopleSlug);

            if (people == null)
                return NotFound();
            Collection collection = new Collection(0, people.slug, people.Name, null, null)
            {
                Shows = libraryManager.GetShowsByPeople(people.id),
                Poster = "peopleimg/" + people.slug
            };
            return collection;
        }
    }
}