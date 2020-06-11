using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Kyoo.Controllers
{
	public class ShowRepository : IShowRepository
	{
		private readonly DatabaseContext _database;
		private readonly IServiceProvider _serviceProvider;
		private readonly IStudioRepository _studios;

		public ShowRepository(DatabaseContext database,
			IServiceProvider serviceProvider, 
			IStudioRepository studios)
		{
			_database = database;
			_serviceProvider = serviceProvider;
			_studios = studios;
		}
		
		public void Dispose()
		{
			_database.Dispose();
			_studios.Dispose();
		}

		public async ValueTask DisposeAsync()
		{
			await Task.WhenAll(_database.DisposeAsync().AsTask(), _studios.DisposeAsync().AsTask());
		}
		
		public async Task<Show> Get(int id)
		{
			return await _database.Shows.FirstOrDefaultAsync(x => x.ID == id);
		}
		
		public async Task<Show> Get(string slug)
		{
			return await _database.Shows.FirstOrDefaultAsync(x => x.Slug == slug);
		}

		public async Task<Show> GetByPath(string path)
		{
			return await _database.Shows.FirstOrDefaultAsync(x => x.Path == path);
		}

		public async Task<ICollection<Show>> Search(string query)
		{
			return await _database.Shows
				.FromSqlInterpolated($@"SELECT * FROM Shows WHERE Shows.Title LIKE {$"%{query}%"}
			                                           OR Shows.Aliases LIKE {$"%{query}%"}")
				.Take(20)
				.ToListAsync();
		}

		public async Task<ICollection<Show>> GetAll()
		{
			return await _database.Shows.ToListAsync();
		}

		public async Task<int> Create(Show obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			await Validate(obj);
			_database.Entry(obj).State = EntityState.Added;
			if (obj.GenreLinks != null)
				foreach (GenreLink entry in obj.GenreLinks)
					_database.Entry(entry).State = EntityState.Added;
			if (obj.People != null)
				foreach (PeopleLink entry in obj.People)
					_database.Entry(entry).State = EntityState.Added;
			if (obj.ExternalIDs != null)
				foreach (MetadataID entry in obj.ExternalIDs)
					_database.Entry(entry).State = EntityState.Added;
			
			try
			{
				await _database.SaveChangesAsync();
			}
			catch (DbUpdateException ex)
			{
				if (Helper.IsDuplicateException(ex))
					throw new DuplicatedItemException($"Trying to insert a duplicated show (slug {obj.Slug} already exists).");
				throw;
			}
			
			return obj.ID;
		}
		
		public async Task<int> CreateIfNotExists(Show obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			Show old = await Get(obj.Slug);
			if (old != null)
				return old.ID;
			return await Create(obj);
		}

		public async Task Edit(Show edited, bool resetOld)
		{
			if (edited == null)
				throw new ArgumentNullException(nameof(edited));
			
			Show old = await Get(edited.Slug);

			if (old == null)
				throw new ItemNotFound($"No show found with the slug {edited.Slug}.");
			
			if (resetOld)
				Utility.Nullify(old);
			Utility.Merge(old, edited);
			await Validate(old);
			await _database.SaveChangesAsync();
		}

		private async Task Validate(Show obj)
		{
			if (obj.Studio != null)
				obj.StudioID = await _studios.CreateIfNotExists(obj.Studio);
			
			if (obj.GenreLinks != null)
			{
				obj.GenreLinks = (await Task.WhenAll(obj.GenreLinks.Select(async x =>
				{
					using IServiceScope serviceScope = _serviceProvider.CreateScope();
					await using IGenreRepository genres = serviceScope.ServiceProvider.GetService<IGenreRepository>();
					
					x.GenreID = await genres.CreateIfNotExists(x.Genre);
					return x;
				}))).ToList();
			}

			if (obj.People != null)
			{
				obj.People = (await Task.WhenAll(obj.People.Select(async x =>
				{
					using IServiceScope serviceScope = _serviceProvider.CreateScope();
					await using IPeopleRepository people = serviceScope.ServiceProvider.GetService<IPeopleRepository>();
					
					x.PeopleID = await people.CreateIfNotExists(x.People);
					return x;
				}))).ToList();
			}

			if (obj.ExternalIDs != null)
			{
				obj.ExternalIDs = (await Task.WhenAll(obj.ExternalIDs.Select(async x =>
				{
					using IServiceScope serviceScope = _serviceProvider.CreateScope();
					await using IProviderRepository providers = serviceScope.ServiceProvider.GetService<IProviderRepository>();
					
					x.ProviderID = await providers.CreateIfNotExists(x.Provider);
					return x;
				}))).ToList();
			}
		}

		public async Task Delete(Show show)
		{
			_database.Shows.Remove(show);
			await _database.SaveChangesAsync();
		}
		
		public async Task AddShowLink(int showID, int? libraryID, int? collectionID)
		{
			if (collectionID != null)
			{
				_database.CollectionLinks.AddIfNotExist(new CollectionLink { CollectionID = collectionID, ShowID = showID},
					x => x.CollectionID == collectionID && x.ShowID == showID);
			}
			if (libraryID != null)
			{
				_database.LibraryLinks.AddIfNotExist(new LibraryLink {LibraryID = libraryID.Value, ShowID = showID},
					x => x.LibraryID == libraryID.Value && x.CollectionID == null && x.ShowID == showID);
			}

			if (libraryID != null && collectionID != null)
			{
				_database.LibraryLinks.AddIfNotExist(
					new LibraryLink {LibraryID = libraryID.Value, CollectionID = collectionID.Value},
					x => x.LibraryID == libraryID && x.CollectionID == collectionID && x.ShowID == null);
			}

			await _database.SaveChangesAsync();
		}
	}
}