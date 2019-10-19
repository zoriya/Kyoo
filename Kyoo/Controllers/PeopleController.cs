using Kyoo.InternalAPI;
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

        [HttpGet("{people-slug}")]
        public ActionResult<Collection> GetPeople(string slug)
        {
            People people = libraryManager.GetPeopleBySlug(slug);

            //This always return not found
            if (people == null)
                return NotFound();

            Debug.WriteLine("&People: " + people.Name);
            Collection collection = new Collection(0, people.slug, people.Name, null, null)
            {
                Shows = libraryManager.GetShowsByPeople(people.id)
            };
            return collection;
        }
    }
}