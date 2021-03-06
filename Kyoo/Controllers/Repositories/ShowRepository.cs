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
	public class ShowRepository : LocalRepository<Show>, IShowRepository
	{
		private bool _disposed;
		private readonly DatabaseContext _database;
		private readonly IStudioRepository _studios;
		private readonly IPeopleRepository _people;
		private readonly IGenreRepository _genres;
		private readonly IProviderRepository _providers;
		private readonly Lazy<ISeasonRepository> _seasons;
		private readonly Lazy<IEpisodeRepository> _episodes;
		protected override Expression<Func<Show, object>> DefaultSort => x => x.Title;

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
			GC.SuppressFinalize(this);
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
				            || EF.Functions.ILike(x.Slug, query) 
							/*|| x.Aliases.Any(y => EF.Functions.ILike(y, query))*/) // NOT TRANSLATABLE.
				.Take(20)
				.ToListAsync();
		}

		public override async Task<Show> Create(Show obj)
		{
			await base.Create(obj);
			_database.Entry(obj).State = EntityState.Added;
			obj.GenreLinks = obj.Genres?.Select(x => Link.Create(obj, x)).ToArray();
			obj.GenreLinks.ForEach(x => _database.Entry(x).State = EntityState.Added);
			obj.People.ForEach(x => _database.Entry(x).State = EntityState.Added);
			obj.ExternalIDs.ForEach(x => _database.Entry(x).State = EntityState.Added);
			await _database.SaveChangesAsync($"Trying to insert a duplicated show (slug {obj.Slug} already exists).");
			return obj;
		}
		
		protected override async Task Validate(Show resource)
		{
			await base.Validate(resource);
			
			if (ShouldValidate(resource.Studio))
				resource.Studio = await _studios.CreateIfNotExists(resource.Studio, true);

			if (resource.Genres != null)
			{
				resource.Genres = await resource.Genres
					.SelectAsync(x => _genres.CreateIfNotExists(x, true))
					.ToListAsync();
			}

			if (resource.People != null)
				foreach (PeopleRole link in resource.People)
					if (ShouldValidate(link))
						link.People = await _people.CreateIfNotExists(link.People, true);

			if (resource.ExternalIDs != null)
				foreach (MetadataID link in resource.ExternalIDs)
					if (ShouldValidate(link))
						link.Provider = await _providers.CreateIfNotExists(link.Provider, true);
		}
		
		public async Task AddShowLink(int showID, int? libraryID, int? collectionID)
		{
			Show show = await Get(showID);
			if (collectionID != null)
			{
				Collection collection = _database.GetTemporaryObject(new Collection {ID = collectionID.Value});
				
				show.Collections ??= new List<Collection>();
				show.Collections.Add(collection);
				await _database.SaveIfNoDuplicates();

				if (libraryID != null)
				{
					Library library = await _database.Libraries.FirstOrDefaultAsync(x => x.ID == libraryID.Value);
					if (library == null)
						throw new ItemNotFound($"No library found with the ID {libraryID.Value}");
					library.Collections ??= new List<Collection>();
					library.Collections.Add(collection);
					await _database.SaveIfNoDuplicates();
				}
			}
			if (libraryID != null)
			{
				Library library = _database.GetTemporaryObject(new Library {ID = libraryID.Value});
				
				show.Libraries ??= new List<Library>();
				show.Libraries.Add(library);
				await _database.SaveIfNoDuplicates();
			}
		}
		
		public override async Task Delete(Show obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			_database.Entry(obj).State = EntityState.Deleted;
			
			
			if (obj.People != null)
				foreach (PeopleRole entry in obj.People)
					_database.Entry(entry).State = EntityState.Deleted;
			
			if (obj.ExternalIDs != null)
				foreach (MetadataID entry in obj.ExternalIDs)
					_database.Entry(entry).State = EntityState.Deleted;

			await _database.SaveChangesAsync();
			
			if (obj.Seasons != null)
				await _seasons.Value.DeleteRange(obj.Seasons);

			if (obj.Episodes != null) 
				await _episodes.Value.DeleteRange(obj.Episodes);
		}
	}
}