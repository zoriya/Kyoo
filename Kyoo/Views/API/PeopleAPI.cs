using System.Linq;
using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.API
{
	[Route("api/[controller]")]
	[ApiController]
	public class PeopleController : ControllerBase
	{
		private readonly ILibraryManager _libraryManager;

		public PeopleController(ILibraryManager libraryManager)
		{
			_libraryManager = libraryManager;
		}

		[HttpGet("{peopleSlug}")]
		[Authorize(Policy="Read")]
		public async Task<ActionResult<Collection>> GetPeople(string peopleSlug)
		{
			People people = await _libraryManager.GetPeople(peopleSlug);

			if (people == null)
				return NotFound();
			return new Collection(people.Slug, people.Name, null, null)
			{
				Shows = people.Roles.Select(x => x.Show),
				Poster = "peopleimg/" + people.Slug
			};
		}
	}
}