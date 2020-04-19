using Kyoo.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Kyoo.Controllers
{
	public interface IThumbnailsManager
	{
		Task<Show> Validate(Show show);
		Task<IEnumerable<PeopleLink>> Validate(IEnumerable<PeopleLink> actors);
		Task<Episode> Validate(Episode episode);
	}
}
