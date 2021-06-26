using System.Collections.Generic;
using System.Threading.Tasks;
using Kyoo.Models;

namespace Kyoo.Controllers
{
	public interface IProviderManager
	{
		Task<Collection> GetCollectionFromName(string name, Library library);
		Task<Show> CompleteShow(Show show, Library library);
		Task<Show> SearchShow(string showName, bool isMovie, Library library);
		Task<IEnumerable<Show>> SearchShows(string showName, bool isMovie, Library library);
		Task<Season> GetSeason(Show show, int seasonNumber, Library library);
		Task<Episode> GetEpisode(Show show, string episodePath, int? seasonNumber, int? episodeNumber, int? absoluteNumber, Library library);
		Task<ICollection<PeopleRole>> GetPeople(Show show, Library library);
	}
}