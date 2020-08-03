using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using JetBrains.Annotations;
using Kyoo.Models;

namespace Kyoo.Controllers
{
	public readonly struct Pagination
	{
		public int Count { get; }
		public int AfterID { get; }

		public Pagination(int count, int afterID = 0)
		{
			Count = count;
			AfterID = afterID;
		}
		
		public static implicit operator Pagination(int limit) => new Pagination(limit);
	}

	public struct Sort<T>
	{
		public Expression<Func<T, object>> Key;
		public bool Descendant;
		
		public Sort(Expression<Func<T, object>> key, bool descendant = false)
		{
			Key = key;
			Descendant = descendant;
			
			if (Key.Body is MemberExpression || 
			    Key.Body.NodeType == ExpressionType.Convert && ((UnaryExpression)Key.Body).Operand is MemberExpression)
				return;
				
			throw new ArgumentException("The given sort key is not valid.");
		}

		public Sort(string sortBy)
		{
			if (string.IsNullOrEmpty(sortBy))
			{
				Key = null;
				Descendant = false;
				return;
			}
			
			string key = sortBy.Contains(':') ? sortBy.Substring(0, sortBy.IndexOf(':')) : sortBy;
			string order = sortBy.Contains(':') ? sortBy.Substring(sortBy.IndexOf(':') + 1) : null;

			ParameterExpression param = Expression.Parameter(typeof(T), "x");
			MemberExpression property = Expression.Property(param, key);
			Key = property.Type.IsValueType
				? Expression.Lambda<Func<T, object>>(Expression.Convert(property, typeof(object)), param)
				: Expression.Lambda<Func<T, object>>(property, param);
					
			Descendant = order switch
			{
				"desc" => true,
				"asc" => false,
				null => false,
				_ => throw new ArgumentException($"The sort order, if set, should be :asc or :desc but it was :{order}.")
			};
		}
	}
	
	public interface IRepository<T> : IDisposable, IAsyncDisposable where T : IResource
	{
		Task<T> Get(int id);
		Task<T> Get(string slug);
		Task<ICollection<T>> Search(string query);
		
		Task<ICollection<T>> GetAll(Expression<Func<T, bool>> where = null, 
			Sort<T> sort = default,
			Pagination limit = default);

		Task<ICollection<T>> GetAll([Optional] Expression<Func<T, bool>> where,
			Expression<Func<T, object>> sort,
			Pagination limit = default
		) => GetAll(where, new Sort<T>(sort), limit);
		
		Task<T> Create([NotNull] T obj);
		Task<T> CreateIfNotExists([NotNull] T obj);
		Task<T> Edit([NotNull] T edited, bool resetOld);
		
		Task Delete(int id);
		Task Delete(string slug);
		Task Delete([NotNull] T obj);

		Task DeleteRange(params T[] objs) => DeleteRange(objs.AsEnumerable());
		Task DeleteRange(IEnumerable<T> objs);
		Task DeleteRange(params int[] ids) => DeleteRange(ids.AsEnumerable());
		Task DeleteRange(IEnumerable<int> ids);
		Task DeleteRange(params string[] slugs) => DeleteRange(slugs.AsEnumerable());
		Task DeleteRange(IEnumerable<string> slugs);
	}

	public interface IShowRepository : IRepository<Show>
	{
		Task AddShowLink(int showID, int? libraryID, int? collectionID);
		
		Task<ICollection<Show>> GetFromLibrary(int id,
			Expression<Func<Show, bool>> where = null, 
			Sort<Show> sort = default,
			Pagination limit = default);
		Task<ICollection<Show>> GetFromLibrary(int id,
			[Optional] Expression<Func<Show, bool>> where,
			Expression<Func<Show, object>> sort,
			Pagination limit = default
		) => GetFromLibrary(id, where, new Sort<Show>(sort), limit);
		
		Task<ICollection<Show>> GetFromLibrary(string slug,
			Expression<Func<Show, bool>> where = null, 
			Sort<Show> sort = default,
			Pagination limit = default);
		Task<ICollection<Show>> GetFromLibrary(string slug,
			[Optional] Expression<Func<Show, bool>> where,
			Expression<Func<Show, object>> sort,
			Pagination limit = default
		) => GetFromLibrary(slug, where, new Sort<Show>(sort), limit);
		
		Task<ICollection<Show>> GetFromCollection(int id,
			Expression<Func<Show, bool>> where = null, 
			Sort<Show> sort = default,
			Pagination limit = default);
		Task<ICollection<Show>> GetFromCollection(int id,
			[Optional] Expression<Func<Show, bool>> where,
			Expression<Func<Show, object>> sort,
			Pagination limit = default
		) => GetFromCollection(id, where, new Sort<Show>(sort), limit);
		
		Task<ICollection<Show>> GetFromCollection(string slug,
			Expression<Func<Show, bool>> where = null, 
			Sort<Show> sort = default,
			Pagination limit = default);
		Task<ICollection<Show>> GetFromCollection(string slug,
			[Optional] Expression<Func<Show, bool>> where,
			Expression<Func<Show, object>> sort,
			Pagination limit = default
		) => GetFromCollection(slug, where, new Sort<Show>(sort), limit);
	}

	public interface ISeasonRepository : IRepository<Season>
	{
		Task<Season> Get(int showID, int seasonNumber);
		Task<Season> Get(string showSlug, int seasonNumber);
		Task Delete(string showSlug, int seasonNumber);
		
		Task<ICollection<Season>> GetFromShow(int showID,
			Expression<Func<Season, bool>> where = null, 
			Sort<Season> sort = default,
			Pagination limit = default);
		Task<ICollection<Season>> GetFromShow(int showID,
			[Optional] Expression<Func<Season, bool>> where,
			Expression<Func<Season, object>> sort,
			Pagination limit = default
		) => GetFromShow(showID, where, new Sort<Season>(sort), limit);
		
		Task<ICollection<Season>> GetFromShow(string showSlug,
			Expression<Func<Season, bool>> where = null, 
			Sort<Season> sort = default,
			Pagination limit = default);
		Task<ICollection<Season>> GetFromShow(string showSlug,
			[Optional] Expression<Func<Season, bool>> where,
			Expression<Func<Season, object>> sort,
			Pagination limit = default
		) => GetFromShow(showSlug, where, new Sort<Season>(sort), limit);
	}
	
	public interface IEpisodeRepository : IRepository<Episode>
	{
		Task<Episode> Get(string showSlug, int seasonNumber, int episodeNumber);
		Task Delete(string showSlug, int seasonNumber, int episodeNumber);
		
		Task<ICollection<Episode>> GetFromShow(int showID,
			Expression<Func<Episode, bool>> where = null, 
			Sort<Episode> sort = default,
			Pagination limit = default);
		Task<ICollection<Episode>> GetFromShow(int showID,
			[Optional] Expression<Func<Episode, bool>> where,
			Expression<Func<Episode, object>> sort,
			Pagination limit = default
		) => GetFromShow(showID, where, new Sort<Episode>(sort), limit);
		
		Task<ICollection<Episode>> GetFromShow(string showSlug,
			Expression<Func<Episode, bool>> where = null, 
			Sort<Episode> sort = default,
			Pagination limit = default);
		Task<ICollection<Episode>> GetFromShow(string showSlug,
			[Optional] Expression<Func<Episode, bool>> where,
			Expression<Func<Episode, object>> sort,
			Pagination limit = default
		) => GetFromShow(showSlug, where, new Sort<Episode>(sort), limit);

		Task<ICollection<Episode>> GetFromSeason(int seasonID,
			Expression<Func<Episode, bool>> where = null, 
			Sort<Episode> sort = default,
			Pagination limit = default);
		Task<ICollection<Episode>> GetFromSeason(int seasonID,
			[Optional] Expression<Func<Episode, bool>> where,
			Expression<Func<Episode, object>> sort,
			Pagination limit = default
		) => GetFromSeason(seasonID, where, new Sort<Episode>(sort), limit);
		Task<ICollection<Episode>> GetFromSeason(int showID,
			int seasonNumber,
			Expression<Func<Episode, bool>> where = null, 
			Sort<Episode> sort = default,
			Pagination limit = default);
		Task<ICollection<Episode>> GetFromSeason(int showID,
			int seasonNumber,
			[Optional] Expression<Func<Episode, bool>> where,
			Expression<Func<Episode, object>> sort,
			Pagination limit = default
		) => GetFromSeason(showID, seasonNumber, where, new Sort<Episode>(sort), limit);
		Task<ICollection<Episode>> GetFromSeason(string showSlug,
			int seasonNumber,
			Expression<Func<Episode, bool>> where = null, 
			Sort<Episode> sort = default,
			Pagination limit = default);
		Task<ICollection<Episode>> GetFromSeason(string showSlug,
			int seasonNumber,
			[Optional] Expression<Func<Episode, bool>> where,
			Expression<Func<Episode, object>> sort,
			Pagination limit = default
		) => GetFromSeason(showSlug, seasonNumber, where, new Sort<Episode>(sort), limit);
	}

	public interface ITrackRepository : IRepository<Track>
	{
		Task<Track> Get(int episodeID, string languageTag, bool isForced);
	}

	public interface ILibraryRepository : IRepository<Library>
	{
		Task<ICollection<Library>> GetFromShow(int showID,
			Expression<Func<Library, bool>> where = null, 
			Sort<Library> sort = default,
			Pagination limit = default);
		Task<ICollection<Library>> GetFromShow(int showID,
			[Optional] Expression<Func<Library, bool>> where,
			Expression<Func<Library, object>> sort,
			Pagination limit = default
		) => GetFromShow(showID, where, new Sort<Library>(sort), limit);
		
		Task<ICollection<Library>> GetFromShow(string showSlug,
			Expression<Func<Library, bool>> where = null, 
			Sort<Library> sort = default,
			Pagination limit = default);
		Task<ICollection<Library>> GetFromShow(string showSlug,
			[Optional] Expression<Func<Library, bool>> where,
			Expression<Func<Library, object>> sort,
			Pagination limit = default
		) => GetFromShow(showSlug, where, new Sort<Library>(sort), limit);
		
		Task<ICollection<Library>> GetFromCollection(int id,
			Expression<Func<Library, bool>> where = null, 
			Sort<Library> sort = default,
			Pagination limit = default);
		Task<ICollection<Library>> GetFromCollection(int id,
			[Optional] Expression<Func<Library, bool>> where,
			Expression<Func<Library, object>> sort,
			Pagination limit = default
		) => GetFromCollection(id, where, new Sort<Library>(sort), limit);
		
		Task<ICollection<Library>> GetFromCollection(string slug,
			Expression<Func<Library, bool>> where = null, 
			Sort<Library> sort = default,
			Pagination limit = default);
		Task<ICollection<Library>> GetFromCollection(string slug,
			[Optional] Expression<Func<Library, bool>> where,
			Expression<Func<Library, object>> sort,
			Pagination limit = default
		) => GetFromCollection(slug, where, new Sort<Library>(sort), limit);
	}

	public interface ILibraryItemRepository : IRepository<LibraryItem>
	{
		public Task<ICollection<LibraryItem>> GetFromLibrary(int id,
			Expression<Func<LibraryItem, bool>> where = null,
			Sort<LibraryItem> sort = default,
			Pagination limit = default);

		public Task<ICollection<LibraryItem>> GetFromLibrary(int id,
			[Optional] Expression<Func<LibraryItem, bool>> where,
			Expression<Func<LibraryItem, object>> sort,
			Pagination limit = default
		) => GetFromLibrary(id, where, new Sort<LibraryItem>(sort), limit);
		
		public Task<ICollection<LibraryItem>> GetFromLibrary(string librarySlug,
			Expression<Func<LibraryItem, bool>> where = null,
			Sort<LibraryItem> sort = default,
			Pagination limit = default);

		public Task<ICollection<LibraryItem>> GetFromLibrary(string librarySlug,
			[Optional] Expression<Func<LibraryItem, bool>> where,
			Expression<Func<LibraryItem, object>> sort,
			Pagination limit = default
		) => GetFromLibrary(librarySlug, where, new Sort<LibraryItem>(sort), limit);
	}

	public interface ICollectionRepository : IRepository<Collection>
	{
		Task<ICollection<Collection>> GetFromShow(int showID,
			Expression<Func<Collection, bool>> where = null, 
			Sort<Collection> sort = default,
			Pagination limit = default);
		Task<ICollection<Collection>> GetFromShow(int showID,
			[Optional] Expression<Func<Collection, bool>> where,
			Expression<Func<Collection, object>> sort,
			Pagination limit = default
		) => GetFromShow(showID, where, new Sort<Collection>(sort), limit);
		
		Task<ICollection<Collection>> GetFromShow(string showSlug,
			Expression<Func<Collection, bool>> where = null, 
			Sort<Collection> sort = default,
			Pagination limit = default);
		Task<ICollection<Collection>> GetFromShow(string showSlug,
			[Optional] Expression<Func<Collection, bool>> where,
			Expression<Func<Collection, object>> sort,
			Pagination limit = default
		) => GetFromShow(showSlug, where, new Sort<Collection>(sort), limit);
		
		Task<ICollection<Collection>> GetFromLibrary(int id,
			Expression<Func<Collection, bool>> where = null, 
			Sort<Collection> sort = default,
			Pagination limit = default);
		Task<ICollection<Collection>> GetFromLibrary(int id,
			[Optional] Expression<Func<Collection, bool>> where,
			Expression<Func<Collection, object>> sort,
			Pagination limit = default
		) => GetFromLibrary(id, where, new Sort<Collection>(sort), limit);
		
		Task<ICollection<Collection>> GetFromLibrary(string slug,
			Expression<Func<Collection, bool>> where = null, 
			Sort<Collection> sort = default,
			Pagination limit = default);
		Task<ICollection<Collection>> GetFromLibrary(string slug,
			[Optional] Expression<Func<Collection, bool>> where,
			Expression<Func<Collection, object>> sort,
			Pagination limit = default
		) => GetFromLibrary(slug, where, new Sort<Collection>(sort), limit);
	}

	public interface IGenreRepository : IRepository<Genre>
	{
		Task<ICollection<Genre>> GetFromShow(int showID,
			Expression<Func<Genre, bool>> where = null, 
			Sort<Genre> sort = default,
			Pagination limit = default);
		Task<ICollection<Genre>> GetFromShow(int showID,
			[Optional] Expression<Func<Genre, bool>> where,
			Expression<Func<Genre, object>> sort,
			Pagination limit = default
		) => GetFromShow(showID, where, new Sort<Genre>(sort), limit);
		
		Task<ICollection<Genre>> GetFromShow(string showSlug,
			Expression<Func<Genre, bool>> where = null, 
			Sort<Genre> sort = default,
			Pagination limit = default);
		Task<ICollection<Genre>> GetFromShow(string showSlug,
			[Optional] Expression<Func<Genre, bool>> where,
			Expression<Func<Genre, object>> sort,
			Pagination limit = default
		) => GetFromShow(showSlug, where, new Sort<Genre>(sort), limit);
	}

	public interface IStudioRepository : IRepository<Studio>
	{
		Task<Studio> GetFromShow(int showID);
		Task<Studio> GetFromShow(string showSlug);
	}

	public interface IPeopleRepository : IRepository<People>
	{
		Task<ICollection<PeopleLink>> GetFromShow(int showID,
			Expression<Func<PeopleLink, bool>> where = null, 
			Sort<PeopleLink> sort = default,
			Pagination limit = default);
		Task<ICollection<PeopleLink>> GetFromShow(int showID,
			[Optional] Expression<Func<PeopleLink, bool>> where,
			Expression<Func<PeopleLink, object>> sort,
			Pagination limit = default
		) => GetFromShow(showID, where, new Sort<PeopleLink>(sort), limit);
		
		Task<ICollection<PeopleLink>> GetFromShow(string showSlug,
			Expression<Func<PeopleLink, bool>> where = null, 
			Sort<PeopleLink> sort = default,
			Pagination limit = default);
		Task<ICollection<PeopleLink>> GetFromShow(string showSlug,
			[Optional] Expression<Func<PeopleLink, bool>> where,
			Expression<Func<PeopleLink, object>> sort,
			Pagination limit = default
		) => GetFromShow(showSlug, where, new Sort<PeopleLink>(sort), limit);
	}
	public interface IProviderRepository : IRepository<ProviderID> {}
}