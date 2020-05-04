using Kyoo.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Kyoo.Controllers
{
	public interface IThumbnailsManager
	{
		Task<Show> Validate(Show show, bool alwaysDownload = false);
		Task<IEnumerable<PeopleLink>> Validate(IEnumerable<PeopleLink> actors, bool alwaysDownload = false);
		Task<Episode> Validate(Episode episode, bool alwaysDownload = false);
	}
}
