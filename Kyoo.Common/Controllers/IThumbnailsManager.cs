using Kyoo.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Kyoo.Controllers
{
	public interface IThumbnailsManager
	{
		Task<Show> Validate(Show show, bool alwaysDownload = false);
		Task<Season> Validate(Season season, bool alwaysDownload = false);
		Task<Episode> Validate(Episode episode, bool alwaysDownload = false);
		Task<People> Validate(People actors, bool alwaysDownload = false);
		Task<ProviderID> Validate(ProviderID actors, bool alwaysDownload = false);
	}
}
