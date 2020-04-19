using System.Collections.Generic;
using System.Threading.Tasks;
using Kyoo.Models;

namespace Kyoo.Controllers
{
	public interface IProviderManager
	{
		Task<Collection> GetCollectionFromName(string name, Library library);
		Task<Show> SearchShow(string showName, bool isMovie, Library library);
		Task<IEnumerable<Show>> SearchShows(string showName, bool isMovie, Library library);
		Task<Season> GetSeason(Show show, long seasonNumber, Library library);
		Task<Episode> GetEpisode(Show show, string episodePath, long seasonNumber, long episodeNumber, long absoluteNumber, Library library);
		Task<IEnumerable<PeopleLink>> GetPeople(Show show, Library library);
	}
}