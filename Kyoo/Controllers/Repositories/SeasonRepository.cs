using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text.RegularExpressions;
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
		/// <summary>
		/// A show repository to get show's slug from their ID and keep the slug in each episode.
		/// </summary>
		private readonly IShowRepository _shows;
		/// <summary>
		/// A lazilly loaded episode repository to handle deletion of episodes with the season.
		/// </summary>
		private readonly Lazy<IEpisodeRepository> _episodes;
		
		/// <inheritdoc/>
		protected override Expression<Func<Season, object>> DefaultSort => x => x.SeasonNumber;


		/// <summary>
		/// Create a new <see cref="SeasonRepository"/> using the provided handle, a provider & a show repository and
		/// a service provider to lazilly request an episode repository.
		/// </summary>
		/// <param name="database">The database handle that will be used</param>
		/// <param name="providers">A provider repository</param>
		/// <param name="shows">A show repository</param>
		/// <param name="episodes">A lazy loaded episode repository.</param>
		public SeasonRepository(DatabaseContext database,
			IProviderRepository providers,
			IShowRepository shows,
			Lazy<IEpisodeRepository> episodes)
			: base(database)
		{
			_database = database;
			_providers = providers;
			_shows = shows;
			_episodes = episodes;
		}
		

		/// <inheritdoc/>
		public override async Task<Season> Get(int id)
		{
			Season ret = await base.Get(id);
			ret.ShowSlug = await _shows.GetSlug(ret.ShowID);
			return ret;
		}

		/// <inheritdoc/>
		public override async Task<Season> Get(Expression<Func<Season, bool>> where)
		{
			Season ret = await base.Get(where);
			ret.ShowSlug = await _shows.GetSlug(ret.ShowID);
			return ret;
		}

		/// <inheritdoc/>
		public override Task<Season> Get(string slug)
		{
			Match match = Regex.Match(slug, @"(?<show>.*)-s(?<season>\d*)");
			
			if (!match.Success)
				throw new ArgumentException("Invalid season slug. Format: {showSlug}-s{seasonNumber}");
			return Get(match.Groups["show"].Value, int.Parse(match.Groups["season"].Value));
		}
		
		/// <inheritdoc/>
		public async Task<Season> Get(int showID, int seasonNumber)
		{
			Season ret = await GetOrDefault(showID, seasonNumber);
			if (ret == null)
				throw new ItemNotFound($"No season {seasonNumber} found for the show {showID}");
			ret.ShowSlug = await _shows.GetSlug(showID);
			return ret;
		}
		
		/// <inheritdoc/>
		public async Task<Season> Get(string showSlug, int seasonNumber)
		{
			Season ret = await GetOrDefault(showSlug, seasonNumber);
			if (ret == null)
				throw new ItemNotFound($"No season {seasonNumber} found for the show {showSlug}");
			ret.ShowSlug = showSlug;
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
			List<Season> seasons = await _database.Seasons
				.Where(x => EF.Functions.ILike(x.Title, $"%{query}%"))
				.OrderBy(DefaultSort)
				.Take(20)
				.ToListAsync();
			foreach (Season season in seasons)
				season.ShowSlug = await _shows.GetSlug(season.ShowID);
			return seasons;
		}
		
		/// <inheritdoc/>
		public override async Task<ICollection<Season>> GetAll(Expression<Func<Season, bool>> where = null,
			Sort<Season> sort = default, 
			Pagination limit = default)
		{
			ICollection<Season> seasons = await base.GetAll(where, sort, limit);
			foreach (Season season in seasons)
				season.ShowSlug = await _shows.GetSlug(season.ShowID);
			return seasons;
		}
		
		/// <inheritdoc/>
		public override async Task<Season> Create(Season obj)
		{
			await base.Create(obj);
			_database.Entry(obj).State = EntityState.Added;
			obj.ExternalIDs.ForEach(x => _database.Entry(x).State = EntityState.Added);
			await _database.SaveChangesAsync($"Trying to insert a duplicated season (slug {obj.Slug} already exists).");
			return obj;
		}

		/// <inheritdoc/>
		protected override async Task Validate(Season resource)
		{
			if (resource.ShowID <= 0)
				throw new InvalidOperationException($"Can't store a season not related to any show (showID: {resource.ShowID}).");

			await base.Validate(resource);
			await resource.ExternalIDs.ForEachAsync(async id =>
			{
				id.Provider = await _providers.CreateIfNotExists(id.Provider, true);
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
			
			_database.Entry(obj).State = EntityState.Deleted;
			obj.ExternalIDs.ForEach(x => _database.Entry(x).State = EntityState.Deleted);
			await _database.SaveChangesAsync();

			if (obj.Episodes != null)
				await _episodes.Value.DeleteRange(obj.Episodes);
		}
	}
}