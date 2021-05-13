using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Models;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Controllers
{
	/// <summary>
	/// A local repository to handle shows
	/// </summary>
	public class ShowRepository : LocalRepository<Show>, IShowRepository
	{
		/// <summary>
		/// The database handle
		/// </summary>
		private readonly DatabaseContext _database;
		/// <summary>
		/// A studio repository to handle creation/validation of related studios.
		/// </summary>
		private readonly IStudioRepository _studios;
		/// <summary>
		/// A people repository to handle creation/validation of related people.
		/// </summary>
		private readonly IPeopleRepository _people;
		/// <summary>
		/// A genres repository to handle creation/validation of related genres.
		/// </summary>
		private readonly IGenreRepository _genres;
		/// <summary>
		/// A provider repository to handle externalID creation and deletion
		/// </summary>
		private readonly IProviderRepository _providers;
		/// <summary>
		/// A lazy loaded season repository to handle cascade deletion (seasons deletion whith it's show) 
		/// </summary>
		private readonly Lazy<ISeasonRepository> _seasons;
		/// <summary>
		/// A lazy loaded episode repository to handle cascade deletion (episode deletion whith it's show) 
		/// </summary>
		private readonly Lazy<IEpisodeRepository> _episodes;

		/// <inheritdoc />
		protected override Expression<Func<Show, object>> DefaultSort => x => x.Title;

		/// <summary>
		/// Create a new <see cref="ShowRepository"/>.
		/// </summary>
		/// <param name="database">The database handle to use</param>
		/// <param name="studios">A studio repository</param>
		/// <param name="people">A people repository</param>
		/// <param name="genres">A genres repository</param>
		/// <param name="providers">A provider repository</param>
		/// <param name="seasons">A lazy loaded season repository</param>
		/// <param name="episodes">A lazy loaded episode repository</param>
		public ShowRepository(DatabaseContext database,
			IStudioRepository studios,
			IPeopleRepository people, 
			IGenreRepository genres, 
			IProviderRepository providers,
			Lazy<ISeasonRepository> seasons,
			Lazy<IEpisodeRepository> episodes)
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
		

		/// <inheritdoc />
		public override async Task<ICollection<Show>> Search(string query)
		{
			query = $"%{query}%";
			return await _database.Shows
				.Where(_database.Like<Show>(x => x.Title + " " + x.Slug, query))
				.OrderBy(DefaultSort)
				.Take(20)
				.ToListAsync();
		}

		/// <inheritdoc />
		public override async Task<Show> Create(Show obj)
		{
			await base.Create(obj);
			_database.Entry(obj).State = EntityState.Added;
			obj.GenreLinks.ForEach(x => _database.Entry(x).State = EntityState.Added);
			obj.People.ForEach(x => _database.Entry(x).State = EntityState.Added);
			obj.ExternalIDs.ForEach(x => _database.Entry(x).State = EntityState.Added);
			await _database.SaveChangesAsync($"Trying to insert a duplicated show (slug {obj.Slug} already exists).");
			return obj;
		}
		
		/// <inheritdoc />
		protected override async Task Validate(Show resource)
		{
			await base.Validate(resource);
			if (resource.Studio != null)
				resource.Studio = await _studios.CreateIfNotExists(resource.Studio);
			resource.Genres = await resource.Genres
				.SelectAsync(x => _genres.CreateIfNotExists(x))
				.ToListAsync();
			resource.GenreLinks = resource.Genres?
				.Select(x => Link.UCreate(resource, x))
				.ToList();
			await resource.ExternalIDs.ForEachAsync(async id =>
			{
				id.Provider = await _providers.CreateIfNotExists(id.Provider);
				id.ProviderID = id.Provider.ID;
				_database.Entry(id.Provider).State = EntityState.Detached;
			});
			await resource.People.ForEachAsync(async role =>
			{
				role.People = await _people.CreateIfNotExists(role.People);
				role.PeopleID = role.People.ID;
				_database.Entry(role.People).State = EntityState.Detached;
			});
		}

		/// <inheritdoc />
		protected override async Task EditRelations(Show resource, Show changed, bool resetOld)
		{
			await Validate(changed);
			
			if (changed.Aliases != null || resetOld)
				resource.Aliases = changed.Aliases;

			if (changed.Genres != null || resetOld)
			{
				await Database.Entry(resource).Collection(x => x.GenreLinks).LoadAsync();
				resource.GenreLinks = changed.Genres?.Select(x => Link.UCreate(resource, x)).ToList();
			}

			if (changed.People != null || resetOld)
			{
				await Database.Entry(resource).Collection(x => x.People).LoadAsync();
				resource.People = changed.People;
			}

			if (changed.ExternalIDs != null || resetOld)
			{
				await Database.Entry(resource).Collection(x => x.ExternalIDs).LoadAsync();
				resource.ExternalIDs = changed.ExternalIDs;
			}
		}

		/// <inheritdoc />
		public async Task AddShowLink(int showID, int? libraryID, int? collectionID)
		{
			if (collectionID != null)
			{
				await _database.Links<Collection, Show>()
					.AddAsync(new Link<Collection, Show>(collectionID.Value, showID));
				await _database.SaveIfNoDuplicates();

				if (libraryID != null)
				{
					await _database.Links<Library, Collection>()
						.AddAsync(new Link<Library, Collection>(libraryID.Value, collectionID.Value));
					await _database.SaveIfNoDuplicates();
				}
			}
			if (libraryID != null)
			{
				await _database.Links<Library, Show>()
					.AddAsync(new Link<Library, Show>(libraryID.Value, showID));
				await _database.SaveIfNoDuplicates();
			}
		}
		
		/// <inheritdoc />
		public Task<string> GetSlug(int showID)
		{
			return _database.Shows.Where(x => x.ID == showID)
				.Select(x => x.Slug)
				.FirstOrDefaultAsync();
		}
		
		/// <inheritdoc />
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