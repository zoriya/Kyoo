using Kyoo.Models;
using System.Threading.Tasks;

namespace Kyoo.InternalAPI
{
    public interface IMetadataProvider
    {
        //For the show
        Task<Show> GetShowByID(string id);

        Task<Show> GetShowFromName(string showName, string showPath);

        Task<Show> GetImages(Show show);

        //For the seasons
        Task<Season> GetSeason(string showName, long seasonNumber);

        Task<string> GetSeasonImage(string showName, long seasonNumber);
    }
}
