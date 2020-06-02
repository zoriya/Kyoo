using System.Collections.Generic;
using Kyoo.Models;

namespace Kyoo.Controllers
{
	public interface IRepository<T>
	{
		T Get(string slug);
		IEnumerable<T> Search(string query);
		IEnumerable<T> GetAll();
		T Create(T obj);
		T CreateIfNotExists(T obj);
		void Edit(T edited, bool resetOld);
		void Delete(string slug);
	}
	
	public interface IShowRepository : IRepository<Show> {}

	public interface ISeasonRepository : IRepository<Season>
	{
		Season Get(string showSlug, int seasonNumber);
	}
	
	public interface IEpisodeRepository : IRepository<Episode>
	{
		Episode Get(string showSlug, int seasonNumber, int episodeNumber);
	}
	
	public interface ILibraryRepository : IRepository<Library> {}
	public interface ICollectionRepository : IRepository<Collection> {}
	public interface IGenreRepository : IRepository<Genre> {}
	public interface IStudioRepository : IRepository<Studio> {}
	public interface IPeopleRepository : IRepository<People> {}
}