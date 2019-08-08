using Kyoo.Models;
using System.Threading.Tasks;

namespace Kyoo.InternalAPI
{
    public interface IMetadataProvider
    {
        Task<Show> CompleteShow(Show show);

        Task<Show> GetShowFromName(string showName, string showPath);

        Task<Show> GetImages(Show show);
    }
}
