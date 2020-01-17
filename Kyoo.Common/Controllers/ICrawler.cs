using System.Threading;
using System.Threading.Tasks;

namespace Kyoo.Controllers
{
    public interface ICrawler
    {
        Task Start(bool watch);

        Task StopAsync();
    }
}
