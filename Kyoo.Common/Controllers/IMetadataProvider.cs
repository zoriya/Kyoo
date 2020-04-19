using Kyoo.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Kyoo.Controllers
{
	public interface IMetadataProvider
	{
		public string Name { get; }
		
		Task<Collection> GetCollectionFromName(string name);

		Task<Show> GetShowByID(Show show);
		Task<IEnumerable<Show>> GetShowsFromName(string showName, bool isMovie);
		Task<IEnumerable<PeopleLink>> GetPeople(Show show);

		Task<Season> GetSeason(Show show, long seasonNumber);

		Task<Episode> GetEpisode(Show show, long seasonNumber, long episodeNumber, long absoluteNumber);
	}
}
