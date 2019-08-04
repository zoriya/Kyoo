using Kyoo.Models;

namespace Kyoo.InternalAPI
{
    public interface IMetadataProvider
    {
        Show GetShowFromName(string showName);
    }
}
