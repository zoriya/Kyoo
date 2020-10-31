using Kyoo.Models;
using Kyoo.Models.Watch;
using System.Threading.Tasks;

namespace Kyoo.Controllers
{
	public interface ITranscoder
	{
		Task<Track[]> ExtractInfos(string path);
		Task<string> Transmux(Episode episode);
		Task<string> Transcode(Episode episode);
	}
}
