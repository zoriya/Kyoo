using Kyoo.Models;
using System.Threading.Tasks;

namespace Kyoo.Controllers
{
	public interface ITranscoder
	{
		Task<Track[]> ExtractInfos(Episode episode, bool reextract);
		Task<string> Transmux(Episode episode);
		Task<string> Transcode(Episode episode);
	}
}
