using System.Threading.Tasks;
using Kyoo.Abstractions.Models;

namespace Kyoo.Abstractions.Controllers
{
	public interface ITranscoder
	{
		Task<Track[]> ExtractInfos(Episode episode, bool reextract);

		Task<string> Transmux(Episode episode);

		Task<string> Transcode(Episode episode);
	}
}
