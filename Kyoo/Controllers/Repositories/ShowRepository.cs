using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
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
		public ShowRepository(DatabaseContext database,
			IStudioRepository studios,
			IPeopleRepository people, 
			IGenreRepository genres, 
			IProviderRepository providers)
			: base(database)
		{
			_database = database;
			_studios = studios;
			_people = people;
			_genres = genres;
			_providers = providers;
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
			await _database.SaveChangesAsync($"Trying to insert a duplicated show (slug {obj.Slug} already exists).");
			return obj;
		}
		
		/// <inheritdoc />
		protected override async Task Validate(Show resource)
		{
			await base.Validate(resource);
			if (resource.Studio != null)
			{
				resource.Studio = await _studios.CreateIfNotExists(resource.Studio);
				resource.StudioID = resource.Studio.ID;
			}

			if (resource.Genres != null)
			{
				resource.Genres = await resource.Genres
					.SelectAsync(x => _genres.CreateIfNotExists(x))
					.ToListAsync();
				_database.AttachRange(resource.Genres);
			}

			if (resource.ExternalIDs != null)
			{
				foreach (MetadataID id in resource.ExternalIDs)
				{
					id.Provider = _database.LocalEntity<Provider>(id.Provider.Slug)
						?? await _providers.CreateIfNotExists(id.Provider);
					id.ProviderID = id.Provider.ID;
				}
				_database.MetadataIds<Show>().AttachRange(resource.ExternalIDs);
			}

			if (resource.People != null)
			{
				foreach (PeopleRole role in resource.People)
				{
					role.People = _database.LocalEntity<People>(role.People.Slug)
						?? await _people.CreateIfNotExists(role.People);
					role.PeopleID = role.People.ID;
					_database.Entry(role).State = EntityState.Added;
				}
			}
		}

		/// <inheritdoc />
		protected override async Task EditRelations(Show resource, Show changed, bool resetOld)
		{
			await Validate(changed);
			
			if (changed.Aliases != null || resetOld)
				resource.Aliases = changed.Aliases;

			if (changed.Studio != null || resetOld)
			{
				await Database.Entry(resource).Reference(x => x.Studio).LoadAsync();
				resource.Studio = changed.Studio;
			}
			
			if (changed.Genres != null || resetOld)
			{
				await Database.Entry(resource).Collection(x => x.Genres).LoadAsync();
				resource.Genres = changed.Genres;
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
				await _database.AddLinks<Collection, Show>(collectionID.Value, showID);
				await _database.SaveIfNoDuplicates();

				if (libraryID != null)
				{
					await _database.AddLinks<Library, Collection>(libraryID.Value, collectionID.Value);
					await _database.SaveIfNoDuplicates();
				}
			}
			if (libraryID != null)
			{
				await _database.AddLinks<Library, Show>(libraryID.Value, showID);
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
			_database.Remove(obj);
			await _database.SaveChangesAsync();
		}
	}
}