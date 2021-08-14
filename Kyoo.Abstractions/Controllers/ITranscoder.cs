using Kyoo.Abstractions.Models;
using System.Threading.Tasks;

namespace Kyoo.Abstractions.Controllers
{
	public interface ITranscoder
	{
		Task<Track[]> ExtractInfos(Episode episode, bool reextract);
		Task<string> Transmux(Episode episode);
		Task<string> Transcode(Episode episode);
	}
}
