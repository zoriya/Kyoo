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
	/// <summary>
	/// A local repository to handle seasons.
	/// </summary>
	public class SeasonRepository : LocalRepository<Season>, ISeasonRepository
	{
		/// <summary>
		/// The database handle
		/// </summary>
		private readonly DatabaseContext _database;
		/// <summary>
		/// A provider repository to handle externalID creation and deletion
		/// </summary>
		private readonly IProviderRepository _providers;

		/// <inheritdoc/>
		protected override Expression<Func<Season, object>> DefaultSort => x => x.SeasonNumber;


		/// <summary>
		/// Create a new <see cref="SeasonRepository"/>.
		/// </summary>
		/// <param name="database">The database handle that will be used</param>
		/// <param name="providers">A provider repository</param>
		public SeasonRepository(DatabaseContext database,
			IProviderRepository providers)
			: base(database)
		{
			_database = database;
			_providers = providers;
		}

		/// <inheritdoc/>
		public async Task<Season> Get(int showID, int seasonNumber)
		{
			Season ret = await GetOrDefault(showID, seasonNumber);
			if (ret == null)
				throw new ItemNotFoundException($"No season {seasonNumber} found for the show {showID}");
			return ret;
		}
		
		/// <inheritdoc/>
		public async Task<Season> Get(string showSlug, int seasonNumber)
		{
			Season ret = await GetOrDefault(showSlug, seasonNumber);
			if (ret == null)
				throw new ItemNotFoundException($"No season {seasonNumber} found for the show {showSlug}");
			return ret;
		}

		/// <inheritdoc/>
		public Task<Season> GetOrDefault(int showID, int seasonNumber)
		{
			return _database.Seasons.FirstOrDefaultAsync(x => x.ShowID == showID 
			                                                  && x.SeasonNumber == seasonNumber);
		}

		/// <inheritdoc/>
		public Task<Season> GetOrDefault(string showSlug, int seasonNumber)
		{
			return _database.Seasons.FirstOrDefaultAsync(x => x.Show.Slug == showSlug 
			                                                  && x.SeasonNumber == seasonNumber);
		}

		/// <inheritdoc/>
		public override async Task<ICollection<Season>> Search(string query)
		{
			return await _database.Seasons
				.Where(_database.Like<Season>(x => x.Title, $"%{query}%"))
				.OrderBy(DefaultSort)
				.Take(20)
				.ToListAsync();
		}

		/// <inheritdoc/>
		public override async Task<Season> Create(Season obj)
		{
			await base.Create(obj);
			_database.Entry(obj).State = EntityState.Added;
			await _database.SaveChangesAsync($"Trying to insert a duplicated season (slug {obj.Slug} already exists).");
			return obj;
		}

		/// <inheritdoc/>
		protected override async Task Validate(Season resource)
		{
			if (resource.ShowID <= 0)
			{
				if (resource.Show == null)
					throw new InvalidOperationException(
						$"Can't store a season not related to any show (showID: {resource.ShowID}).");
				resource.ShowID = resource.Show.ID;
			}

			await base.Validate(resource);
			await resource.ExternalIDs.ForEachAsync(async id =>
			{
				id.Provider = await _providers.CreateIfNotExists(id.Provider);
				id.ProviderID = id.Provider.ID;
				_database.Entry(id.Provider).State = EntityState.Detached;
			});
		}

		/// <inheritdoc/>
		protected override async Task EditRelations(Season resource, Season changed, bool resetOld)
		{
			if (changed.ExternalIDs != null || resetOld)
			{
				await Database.Entry(resource).Collection(x => x.ExternalIDs).LoadAsync();
				resource.ExternalIDs = changed.ExternalIDs;
			}
			await base.EditRelations(resource, changed, resetOld);
		}
		
		/// <inheritdoc/>
		public override async Task Delete(Season obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			_database.Remove(obj);
			await _database.SaveChangesAsync();
		}
	}
}