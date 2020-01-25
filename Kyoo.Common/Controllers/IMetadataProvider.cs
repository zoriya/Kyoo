using Kyoo.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Kyoo.Controllers
{
    public interface IMetadataProvider
    {
        public string Name { get; }
        
        //For the collection
        Task<Collection> GetCollectionFromName(string name);

        //For the show
        Task<Show> GetShowByID(string id);
        Task<Show> GetShowFromName(string showName);
        Task<IEnumerable<People>> GetPeople(Show show);

        //For the seasons
        Task<Season> GetSeason(Show show, long seasonNumber);

        //For the episodes
        Task<Episode> GetEpisode(Show show, long seasonNumber, long episodeNumber, long absoluteNumber);
    }
}
