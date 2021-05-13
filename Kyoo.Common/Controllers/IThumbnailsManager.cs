using Kyoo.Models;
using System.Threading.Tasks;
using JetBrains.Annotations;

namespace Kyoo.Controllers
{
	public interface IThumbnailsManager
	{
		Task Validate(Show show, bool alwaysDownload = false);
		Task Validate(Season season, bool alwaysDownload = false);
		Task Validate(Episode episode, bool alwaysDownload = false);
		Task Validate(People actors, bool alwaysDownload = false);
		Task Validate(Provider actors, bool alwaysDownload = false);

		Task<string> GetShowPoster([NotNull] Show show);
		Task<string> GetShowLogo([NotNull] Show show);
		Task<string> GetShowBackdrop([NotNull] Show show);
		Task<string> GetSeasonPoster([NotNull] Season season);
		Task<string> GetEpisodeThumb([NotNull] Episode episode);
		Task<string> GetPeoplePoster([NotNull] People people);
		Task<string> GetProviderLogo([NotNull] Provider provider);
	}
}
