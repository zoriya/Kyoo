using System.Collections.Generic;
using System.Threading.Tasks;
using Kyoo.Models;

namespace Kyoo.Controllers
{
	public interface IProviderManager
	{
		Task<Collection> GetCollectionFromName(string name, Library library);
		Task<Show> GetShowFromName(string showName, Library library);
		Task<Season> GetSeason(Show show, long seasonNumber, Library library);
		Task<Episode> GetEpisode(Show show, long seasonNumber, long episodeNumber, long absoluteNumber, Library library);
		Task<IEnumerable<People>> GetPeople(Show show, Library library);
	}
}