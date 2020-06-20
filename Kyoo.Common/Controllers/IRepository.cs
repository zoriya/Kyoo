using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using JetBrains.Annotations;
using Kyoo.Models;

namespace Kyoo.Controllers
{
	public interface IRepository<T> : IDisposable, IAsyncDisposable
	{
		Task<T> Get(int id);
		Task<T> Get(string slug);
		Task<ICollection<T>> Search(string query);
		Task<ICollection<T>> GetAll();
		Task<int> Create([NotNull] T obj);
		Task<int> CreateIfNotExists([NotNull] T obj);
		Task Edit([NotNull] T edited, bool resetOld);
		Task Delete(int id);
		Task Delete(string slug);
		Task Delete([NotNull] T obj);
	}

	public interface IShowRepository : IRepository<Show>
	{
		Task<Show> GetByPath(string path);
		Task AddShowLink(int showID, int? libraryID, int? collectionID);
	}

	public interface ISeasonRepository : IRepository<Season>
	{
		Task<Season> Get(string showSlug, int seasonNumber);
		Task Delete(string showSlug, int seasonNumber);
		
		Task<ICollection<Season>> GetSeasons(int showID);
		Task<ICollection<Season>> GetSeasons(string showSlug);
	}
	
	public interface IEpisodeRepository : IRepository<Episode>
	{
		Task<Episode> Get(string showSlug, int seasonNumber, int episodeNumber);
		Task Delete(string showSlug, int seasonNumber, int episodeNumber);
		
		Task<ICollection<Episode>> GetEpisodes(int showID, int seasonNumber);
		Task<ICollection<Episode>> GetEpisodes(string showSlug, int seasonNumber);
		Task<ICollection<Episode>> GetEpisodes(int seasonID);
	}

	public interface ITrackRepository : IRepository<Track>
	{
		Task<Track> Get(int episodeID, string languageTag, bool isForced);
	}
	public interface ILibraryRepository : IRepository<Library> {}
	public interface ICollectionRepository : IRepository<Collection> {}
	public interface IGenreRepository : IRepository<Genre> {}
	public interface IStudioRepository : IRepository<Studio> {}
	public interface IPeopleRepository : IRepository<People> {}
	public interface IProviderRepository : IRepository<ProviderID> {}
}