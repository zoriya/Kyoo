using Kyoo.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
using JetBrains.Annotations;

namespace Kyoo.Controllers
{
	public interface IThumbnailsManager
	{
		Task<Show> Validate(Show show, bool alwaysDownload = false);
		Task<Season> Validate(Season season, bool alwaysDownload = false);
		Task<Episode> Validate(Episode episode, bool alwaysDownload = false);
		Task<People> Validate(People actors, bool alwaysDownload = false);
		Task<ProviderID> Validate(ProviderID actors, bool alwaysDownload = false);

		Task<string> GetShowPoster([NotNull] Show show);
		Task<string> GetShowLogo([NotNull] Show show);
		Task<string> GetShowBackdrop([NotNull] Show show);
		Task<string> GetSeasonPoster([NotNull] Season season);
		Task<string> GetEpisodeThumb([NotNull] Episode episode);
		Task<string> GetPeoplePoster([NotNull] People people);
		Task<string> GetProviderLogo([NotNull] ProviderID provider);
	}
}
