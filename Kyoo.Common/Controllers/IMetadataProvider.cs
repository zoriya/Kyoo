using Kyoo.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Kyoo.Controllers
{
	public interface IMetadataProvider
	{
		Provider Provider { get; }

		Task<Collection> GetCollectionFromName(string name);

		Task<Show> GetShowByID(Show show);
		Task<ICollection<Show>> SearchShows(string showName, bool isMovie);
		Task<ICollection<PeopleRole>> GetPeople(Show show);

		Task<Season> GetSeason(Show show, int seasonNumber);

		Task<Episode> GetEpisode(Show show, int seasonNumber, int episodeNumber, int absoluteNumber);
	}
}
