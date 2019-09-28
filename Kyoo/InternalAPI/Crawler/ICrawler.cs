using System.Threading;
using System.Threading.Tasks;

namespace Kyoo.InternalAPI
{
    public interface ICrawler
    {
        Task Start(bool watch);

        Task StopAsync();
    }
}
