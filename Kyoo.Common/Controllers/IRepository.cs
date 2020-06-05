using System.Collections.Generic;
using System.Threading.Tasks;
using JetBrains.Annotations;
using Kyoo.Models;

namespace Kyoo.Controllers
{
	public interface IRepository<T>
	{
		Task<T> Get(long id);
		Task<T> Get(string slug);
		Task<IEnumerable<T>> Search(string query);
		Task<IEnumerable<T>> GetAll();
		Task<long> Create([NotNull] T obj);
		Task<long> CreateIfNotExists([NotNull] T obj);
		Task Edit([NotNull] T edited, bool resetOld);
		Task Delete(T obj);
	}
	
	public interface IShowRepository : IRepository<Show> {}

	public interface ISeasonRepository : IRepository<Season>
	{
		Task<Season> Get(string showSlug, long seasonNumber);
	}
	
	public interface IEpisodeRepository : IRepository<Episode>
	{
		Task<Episode> Get(string showSlug, long seasonNumber, long episodeNumber);
	}

	public interface ITrackRepository : IRepository<Track>
	{
		Task<Track> Get(long episodeID, string languageTag, bool isForced);
	}
	public interface ILibraryRepository : IRepository<Library> {}
	public interface ICollectionRepository : IRepository<Collection> {}
	public interface IGenreRepository : IRepository<Genre> {}
	public interface IStudioRepository : IRepository<Studio> {}
	public interface IPeopleRepository : IRepository<People> {}
	public interface IProviderRepository : IRepository<ProviderID> {}
}