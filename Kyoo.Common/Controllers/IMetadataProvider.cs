using Kyoo.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Kyoo.Controllers
{
    public interface IMetadataProvider
    {
        //For the collection
        Task<Collection> GetCollectionFromName(string name);

        //For the show
        Task<Show> GetShowByID(string id);
        Task<Show> GetShowFromName(string showName, string showPath);
        Task<Show> GetImages(Show show);
        Task<List<People>> GetPeople(string id);

        //For the seasons
        Task<Season> GetSeason(string showName, long seasonNumber);
        Task<string> GetSeasonImage(string showName, long seasonNumber);

        //For the episodes
        Task<Episode> GetEpisode(string externalIDs, long seasonNumber, long episodeNumber, long absoluteNumber, string episodePath);
    }
}
