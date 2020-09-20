using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Kyoo.Controllers
{
	public class ShowRepository : LocalRepository<Show, ShowDE>, IShowRepository
	{
		private bool _disposed;
		private readonly DatabaseContext _database;
		private readonly IStudioRepository _studios;
		private readonly IPeopleRepository _people;
		private readonly IGenreRepository _genres;
		private readonly IProviderRepository _providers;
		private readonly Lazy<ISeasonRepository> _seasons;
		private readonly Lazy<IEpisodeRepository> _episodes;
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
		}

		public override void Dispose()
		{
			if (_disposed)
				return;
			_disposed = true;
			_database.Dispose();
			_studios.Dispose();
			_people.Dispose();
			_genres.Dispose();
			_providers.Dispose();
			if (_seasons.IsValueCreated)
				_seasons.Value.Dispose();
			if (_episodes.IsValueCreated)
				_episodes.Value.Dispose();
		}

		public override async ValueTask DisposeAsync()
		{
			if (_disposed)
				return;
			_disposed = true;
			await _database.DisposeAsync();
			await _studios.DisposeAsync();
			await _people.DisposeAsync();
			await _genres.DisposeAsync();
			await _providers.DisposeAsync();
			if (_seasons.IsValueCreated)
				await _seasons.Value.DisposeAsync();
			if (_episodes.IsValueCreated)
				await _episodes.Value.DisposeAsync();
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

		public override async Task<ShowDE> Create(ShowDE obj)
		{
			await base.Create(obj);
			_database.Entry(obj).State = EntityState.Added;
			
			if (obj.GenreLinks != null)
			{
				foreach (GenreLink entry in obj.GenreLinks)
				{
					if (!(entry.Genre is GenreDE))
						entry.Genre = new GenreDE(entry.Genre);
					_database.Entry(entry).State = EntityState.Added;
				}
			}

			if (obj.People != null)
				foreach (PeopleRole entry in obj.People)
					_database.Entry(entry).State = EntityState.Added;
			if (obj.ExternalIDs != null)
				foreach (MetadataID entry in obj.ExternalIDs)
					_database.Entry(entry).State = EntityState.Added;
			
			await _database.SaveChangesAsync($"Trying to insert a duplicated show (slug {obj.Slug} already exists).");
			return obj;
		}
		
		protected override async Task Validate(ShowDE resource)
		{
			await base.Validate(resource);
			
			if (resource.Studio != null)
				resource.Studio = await _studios.CreateIfNotExists(resource.Studio, true);
			
			if (resource.GenreLinks != null)
				foreach (GenreLink link in resource.GenreLinks)
					link.Genre = await _genres.CreateIfNotExists(link.Genre, true);

			if (resource.People != null)
				foreach (PeopleRole link in resource.People)
					link.People = await _people.CreateIfNotExists(link.People, true);

			if (resource.ExternalIDs != null)
				foreach (MetadataID link in resource.ExternalIDs)
					link.Provider = await _providers.CreateIfNotExists(link.Provider, true);
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
		
		public override async Task Delete(ShowDE obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
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
	}
}