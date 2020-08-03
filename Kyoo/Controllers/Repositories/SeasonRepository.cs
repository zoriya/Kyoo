using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Kyoo.Controllers
{
	public class SeasonRepository : LocalRepository<Season>, ISeasonRepository
	{
		private readonly DatabaseContext _database;
		private readonly IProviderRepository _providers;
		private readonly Lazy<IEpisodeRepository> _episodes;
		private readonly IShowRepository _shows;
		protected override Expression<Func<Season, object>> DefaultSort => x => x.SeasonNumber;


		public SeasonRepository(DatabaseContext database, 
			IProviderRepository providers,
			IShowRepository shows,
			IServiceProvider services)
			: base(database)
		{
			_database = database;
			_providers = providers;
			_episodes = new Lazy<IEpisodeRepository>(services.GetRequiredService<IEpisodeRepository>);
			_shows = shows;
		}


		public override void Dispose()
		{
			_database.Dispose();
			_providers.Dispose();
			if (_episodes.IsValueCreated)
				_episodes.Value.Dispose();
		}

		public override async ValueTask DisposeAsync()
		{
			await _database.DisposeAsync();
			await _providers.DisposeAsync();
			if (_episodes.IsValueCreated)
				await _episodes.Value.DisposeAsync();
		}

		public override Task<Season> Get(string slug)
		{
			Match match = Regex.Match(slug, @"(?<show>.*)-s(?<season>\d*)");
			
			if (!match.Success)
				throw new ArgumentException("Invalid season slug. Format: {showSlug}-s{seasonNumber}");
			return Get(match.Groups["show"].Value, int.Parse(match.Groups["season"].Value));
		}
		
		public Task<Season> Get(int showID, int seasonNumber)
		{
			return _database.Seasons.FirstOrDefaultAsync(x => x.ShowID == showID 
			                                                  && x.SeasonNumber == seasonNumber);
		}
		
		public Task<Season> Get(string showSlug, int seasonNumber)
		{
			return _database.Seasons.FirstOrDefaultAsync(x => x.Show.Slug == showSlug 
			                                                        && x.SeasonNumber == seasonNumber);
		}

		public override async Task<ICollection<Season>> Search(string query)
		{
			return await _database.Seasons
				.Where(x => EF.Functions.ILike(x.Title, $"%{query}%"))
				.Take(20)
				.ToListAsync();
		}
		
		public override async Task<Season> Create(Season obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			await Validate(obj);
			_database.Entry(obj).State = EntityState.Added;
			if (obj.ExternalIDs != null)
				foreach (MetadataID entry in obj.ExternalIDs)
					_database.Entry(entry).State = EntityState.Added;
			
			await _database.SaveChangesAsync($"Trying to insert a duplicated season (slug {obj.Slug} already exists).");
			return obj;
		}

		protected override async Task Validate(Season obj)
		{
			if (obj.ShowID <= 0)
				throw new InvalidOperationException($"Can't store a season not related to any show (showID: {obj.ShowID}).");

			if (obj.ExternalIDs != null)
			{
				foreach (MetadataID link in obj.ExternalIDs)
					link.Provider = await _providers.CreateIfNotExists(link.Provider);
			}
		}
		
		public async Task<ICollection<Season>> GetFromShow(int showID,
			Expression<Func<Season, bool>> where = null, 
			Sort<Season> sort = default,
			Pagination limit = default)
		{
			ICollection<Season> seasons = await ApplyFilters(_database.Seasons.Where(x => x.ShowID == showID),
				where,
				sort,
				limit);
			if (!seasons.Any() && await _shows.Get(showID) == null)
				throw new ItemNotFound();
			return seasons;
		}

		public async Task<ICollection<Season>> GetFromShow(string showSlug,
			Expression<Func<Season, bool>> where = null, 
			Sort<Season> sort = default,
			Pagination limit = default)
		{
			ICollection<Season> seasons = await ApplyFilters(_database.Seasons.Where(x => x.Show.Slug == showSlug),
				where,
				sort,
				limit);
			if (!seasons.Any() && await _shows.Get(showSlug) == null)
				throw new ItemNotFound();
			return seasons;
		}
		
		public async Task Delete(string showSlug, int seasonNumber)
		{
			Season obj = await Get(showSlug, seasonNumber);
			await Delete(obj);
		}

		public override async Task Delete(Season obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			_database.Entry(obj).State = EntityState.Deleted;
			
			if (obj.ExternalIDs != null)
				foreach (MetadataID entry in obj.ExternalIDs)
					_database.Entry(entry).State = EntityState.Deleted;
			
			await _database.SaveChangesAsync();

			if (obj.Episodes != null)
				await _episodes.Value.DeleteRange(obj.Episodes);
		}
	}
}