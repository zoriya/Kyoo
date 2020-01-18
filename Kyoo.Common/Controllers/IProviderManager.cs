using System.Collections.Generic;
using System.Threading.Tasks;
using Kyoo.Models;

namespace Kyoo.Controllers
{
	public interface IProviderManager
	{
		Task<Collection> GetCollectionFromName(string name, Library library);
		Task<Show> GetShowFromName(string showName, string showPath, Library library);
		Task<Season> GetSeason(string showName, long seasonNumber, Library library);
		Task<Episode> GetEpisode(string externalIDs, long seasonNumber, long episodeNumber, long absoluteNumber, string episodePath, Library library);
		Task<IEnumerable<People>> GetPeople(string showExternalIDs, Library library);
	}
}