using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Controllers
{
	public class ShowRepository : LocalRepository<Show>, IShowRepository
	{
		private readonly DatabaseContext _database;
		private readonly IStudioRepository _studios;
		private readonly IPeopleRepository _people;
		private readonly IGenreRepository _genres;
		private readonly IProviderRepository _providers;
		private readonly ISeasonRepository _seasons;
		private readonly IEpisodeRepository _episodes;
		protected override Expression<Func<Show, object>> DefaultSort => x => x.Title;

		public ShowRepository(DatabaseContext database,
			IStudioRepository studios,
			IPeopleRepository people, 
			IGenreRepository genres, 
			IProviderRepository providers, 
			ISeasonRepository seasons, 
			IEpisodeRepository episodes)
			: base(database)
		{
			_database = database;
			_studios = studios;
			_people = people;
			_genres = genres;
			_providers = providers;
			_seasons = seasons;
			_episodes = episodes;
		}

		public override void Dispose()
		{
			_database.Dispose();
			_studios.Dispose();
			_people.Dispose();
			_genres.Dispose();
			_providers.Dispose();
			_seasons.Dispose();
			_episodes.Dispose();
		}

		public override async ValueTask DisposeAsync()
		{
			await _database.DisposeAsync();
			await _studios.DisposeAsync();
			await _people.DisposeAsync();
			await _genres.DisposeAsync();
			await _providers.DisposeAsync();
			await _seasons.DisposeAsync();
			await _episodes.DisposeAsync();
		}

		public override async Task<ICollection<Show>> Search(string query)
		{
			return await _database.Shows
				.Where(x => EF.Functions.ILike(x.Title, $"%{query}%") 
				            /*|| EF.Functions.ILike(x.Aliases, $"%{query}%")*/)
				.Take(20)
				.ToListAsync();
		}

		public override async Task<Show> Create(Show obj)
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
				_database.DiscardChanges();
				if (IsDuplicateException(ex))
					throw new DuplicatedItemException($"Trying to insert a duplicated show (slug {obj.Slug} already exists).");
				throw;
			}
			
			return obj;
		}
		
		protected override async Task Validate(Show obj)
		{
			if (obj.Studio != null)
				obj.Studio = await _studios.CreateIfNotExists(obj.Studio);
			
			if (obj.GenreLinks != null)
				foreach (GenreLink link in obj.GenreLinks)
					link.Genre = await _genres.CreateIfNotExists(link.Genre);

			if (obj.People != null)
				foreach (PeopleLink link in obj.People)
					link.People = await _people.CreateIfNotExists(link.People);

			if (obj.ExternalIDs != null)
				foreach (MetadataID link in obj.ExternalIDs)
					link.Provider = await _providers.CreateIfNotExists(link.Provider);
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
		
		public override async Task Delete(Show obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			_database.Entry(obj).State = EntityState.Deleted;
			
			if (obj.GenreLinks != null)
				foreach (GenreLink entry in obj.GenreLinks)
					_database.Entry(entry).State = EntityState.Deleted;
			
			if (obj.People != null)
				foreach (PeopleLink entry in obj.People)
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

			// TODO fix circular references of Show/Season/Episode Repository.
			if (obj.Seasons != null)
				await _seasons.DeleteRange(obj.Seasons);

			if (obj.Episodes != null) 
				await _episodes.DeleteRange(obj.Episodes);
		}
	}
}