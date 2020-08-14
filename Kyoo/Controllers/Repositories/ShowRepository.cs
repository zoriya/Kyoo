using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Kyoo.Controllers
{
	public class ShowRepository : LocalRepository<Show, ShowDE>, IShowRepository
	{
		private readonly DatabaseContext _database;
		private readonly IStudioRepository _studios;
		private readonly IPeopleRepository _people;
		private readonly IGenreRepository _genres;
		private readonly IProviderRepository _providers;
		private readonly Lazy<ISeasonRepository> _seasons;
		private readonly Lazy<IEpisodeRepository> _episodes;
		private readonly Lazy<ILibraryRepository> _libraries;
		private readonly Lazy<ICollectionRepository> _collections;
		protected override Expression<Func<ShowDE, object>> DefaultSort => x => x.Title;

		public ShowRepository(DatabaseContext database,
			IStudioRepository studios,
			IPeopleRepository people, 
			IGenreRepository genres, 
			IProviderRepository providers,
			IServiceProvider services)
			: base(database)
		{
			_database = database;
			_studios = studios;
			_people = people;
			_genres = genres;
			_providers = providers;
			_seasons = new Lazy<ISeasonRepository>(services.GetRequiredService<ISeasonRepository>);
			_episodes = new Lazy<IEpisodeRepository>(services.GetRequiredService<IEpisodeRepository>);
			_libraries = new Lazy<ILibraryRepository>(services.GetRequiredService<ILibraryRepository>);
			_collections = new Lazy<ICollectionRepository>(services.GetRequiredService<ICollectionRepository>);
		}

		public override void Dispose()
		{
			_database.Dispose();
			_studios.Dispose();
			_people.Dispose();
			_genres.Dispose();
			_providers.Dispose();
			if (_seasons.IsValueCreated)
				_seasons.Value.Dispose();
			if (_episodes.IsValueCreated)
				_episodes.Value.Dispose();
			if (_libraries.IsValueCreated)
				_libraries.Value.Dispose();
			if (_collections.IsValueCreated)
				_collections.Value.Dispose();
		}

		public override async ValueTask DisposeAsync()
		{
			await _database.DisposeAsync();
			await _studios.DisposeAsync();
			await _people.DisposeAsync();
			await _genres.DisposeAsync();
			await _providers.DisposeAsync();
			if (_seasons.IsValueCreated)
				await _seasons.Value.DisposeAsync();
			if (_episodes.IsValueCreated)
				await _episodes.Value.DisposeAsync();
			if (_libraries.IsValueCreated)
				await _libraries.Value.DisposeAsync();
			if (_collections.IsValueCreated)
				await _collections.Value.DisposeAsync();
		}

		public override async Task<ICollection<Show>> Search(string query)
		{
			query = $"%{query}%";
			return await _database.Shows
				.Where(x => EF.Functions.ILike(x.Title, query) 
				            /*|| x.Aliases.Any(y => EF.Functions.ILike(y, query))*/) // NOT TRANSLATABLE.
				.Take(20)
				.ToListAsync<Show>();
		}

		public override async Task<Show> Create(Show item)
		{
			if (item == null)
				throw new ArgumentNullException(nameof(item));
			ShowDE obj = new ShowDE(item);

			await Validate(obj);
			_database.Entry(obj).State = EntityState.Added;
			if (obj.GenreLinks != null)
				foreach (GenreLink entry in obj.GenreLinks)
					_database.Entry(entry).State = EntityState.Added;
			if (obj.People != null)
				foreach (PeopleRole entry in obj.People)
					_database.Entry(entry).State = EntityState.Added;
			if (obj.ExternalIDs != null)
				foreach (MetadataID entry in obj.ExternalIDs)
					_database.Entry(entry).State = EntityState.Added;
			
			await _database.SaveChangesAsync($"Trying to insert a duplicated show (slug {obj.Slug} already exists).");
			return obj;
		}
		
		protected override async Task Validate(ShowDE obj)
		{
			await base.Validate(obj);
			
			if (obj.Studio != null)
				obj.Studio = await _studios.CreateIfNotExists(obj.Studio);
			
			if (obj.GenreLinks != null)
				foreach (GenreLink link in obj.GenreLinks)
					link.Genre = await _genres.CreateIfNotExists(link.Genre);

			if (obj.People != null)
				foreach (PeopleRole link in obj.People)
					link.People = await _people.CreateIfNotExists(link.People);

			if (obj.ExternalIDs != null)
				foreach (MetadataID link in obj.ExternalIDs)
					link.Provider = await _providers.CreateIfNotExists(link.Provider);
		}
		
		public async Task AddShowLink(int showID, int? libraryID, int? collectionID)
		{
			if (collectionID != null)
			{
				await _database.CollectionLinks.AddAsync(new CollectionLink {CollectionID = collectionID, ShowID = showID});
				await _database.SaveIfNoDuplicates();
			}
			if (libraryID != null)
			{
				await _database.LibraryLinks.AddAsync(new LibraryLink {LibraryID = libraryID.Value, ShowID = showID});
				await _database.SaveIfNoDuplicates();
			}

			if (libraryID != null && collectionID != null)
			{
				await _database.LibraryLinks.AddAsync(new LibraryLink {LibraryID = libraryID.Value, CollectionID = collectionID.Value});
				await _database.SaveIfNoDuplicates();
			}
		}
		
		public override async Task Delete(Show item)
		{
			if (item == null)
				throw new ArgumentNullException(nameof(item));
			ShowDE obj = new ShowDE(item);
			
			_database.Entry(obj).State = EntityState.Deleted;
			
			if (obj.GenreLinks != null)
				foreach (GenreLink entry in obj.GenreLinks)
					_database.Entry(entry).State = EntityState.Deleted;
			
			if (obj.People != null)
				foreach (PeopleRole entry in obj.People)
					_database.Entry(entry).State = EntityState.Deleted;
			
			if (obj.ExternalIDs != null)
				foreach (MetadataID entry in obj.ExternalIDs)
					_database.Entry(entry).State = EntityState.Deleted;
			
			if (obj.CollectionLinks != null)
				foreach (CollectionLink entry in obj.CollectionLinks)
					_database.Entry(entry).State = EntityState.Deleted;
			
			if (obj.LibraryLinks != null)
				foreach (LibraryLink entry in obj.LibraryLinks)
					_database.Entry(entry).State = EntityState.Deleted;

			await _database.SaveChangesAsync();
			
			if (obj.Seasons != null)
				await _seasons.Value.DeleteRange(obj.Seasons);

			if (obj.Episodes != null) 
				await _episodes.Value.DeleteRange(obj.Episodes);
		}

		public async Task<ICollection<Show>> GetFromLibrary(int id, 
			Expression<Func<Show, bool>> where = null,
			Sort<Show> sort = default,
			Pagination limit = default)
		{
			ICollection<Show> shows = await ApplyFilters(_database.LibraryLinks
					.Where(x => x.LibraryID == id && x.ShowID != null)
					.Select(x => x.Show as ShowDE),
				where,
				sort,
				limit);
			if (!shows.Any() && await _libraries.Value.Get(id) == null)
				throw new ItemNotFound();
			return shows;
		}

		public async Task<ICollection<Show>> GetFromLibrary(string slug,
			Expression<Func<Show, bool>> where = null,
			Sort<Show> sort = default, 
			Pagination limit = default)
		{
			ICollection<Show> shows = await ApplyFilters(_database.LibraryLinks
					.Where(x => x.Library.Slug == slug && x.ShowID != null)
					.Select(x => x.Show as ShowDE),
				where,
				sort,
				limit);
			if (!shows.Any() && await _libraries.Value.Get(slug) == null)
				throw new ItemNotFound();
			return shows;
		}
		
		public async Task<ICollection<Show>> GetFromCollection(int id, 
			Expression<Func<Show, bool>> where = null,
			Sort<Show> sort = default,
			Pagination limit = default)
		{
			ICollection<Show> shows = await ApplyFilters(_database.CollectionLinks
					.Where(x => x.CollectionID== id)
					.Select(x => x.Show as ShowDE),
				where,
				sort,
				limit);
			if (!shows.Any() && await _libraries.Value.Get(id) == null)
				throw new ItemNotFound();
			return shows;
		}

		public async Task<ICollection<Show>> GetFromCollection(string slug,
			Expression<Func<Show, bool>> where = null,
			Sort<Show> sort = default, 
			Pagination limit = default)
		{
			ICollection<Show> shows = await ApplyFilters(_database.CollectionLinks
					.Where(x => x.Collection.Slug == slug)
					.Select(x => x.Show as ShowDE),
				where,
				sort,
				limit);
			if (!shows.Any() && await _libraries.Value.Get(slug) == null)
				throw new ItemNotFound();
			return shows;
		}

		public Task<Show> GetFromSeason(int seasonID)
		{
			return _database.Shows
				.FirstOrDefaultAsync(x => x.Seasons.Any(y => y.ID == seasonID))
				.Cast<Show>();
		}
		
		public Task<Show> GetFromEpisode(int episodeID)
		{
			return _database.Shows
				.FirstOrDefaultAsync(x => x.Episodes.Any(y => y.ID == episodeID))
				.Cast<Show>();
		}
	}
}