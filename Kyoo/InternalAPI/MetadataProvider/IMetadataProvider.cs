using Kyoo.Models;
using System.Threading.Tasks;

namespace Kyoo.InternalAPI
{
    public interface IMetadataProvider
    {
        Task<Show> GetShowFromID(string externalIDs);

        Task<Show> GetShowFromName(string showName);
    }
}
