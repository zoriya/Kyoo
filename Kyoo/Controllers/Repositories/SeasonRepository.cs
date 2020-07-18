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
	public class SeasonRepository : LocalRepository<Season>, ISeasonRepository
	{
		private readonly DatabaseContext _database;
		private readonly IProviderRepository _providers;
		private readonly IEpisodeRepository _episodes;
		protected override Expression<Func<Season, object>> DefaultSort => x => x.SeasonNumber;


		public SeasonRepository(DatabaseContext database, IProviderRepository providers, IEpisodeRepository episodes)
			: base(database)
		{
			_database = database;
			_providers = providers;
			_episodes = episodes;
		}


		public override void Dispose()
		{
			_database.Dispose();
			_providers.Dispose();
			_episodes.Dispose();
		}

		public override async ValueTask DisposeAsync()
		{
			await _database.DisposeAsync();
			await _providers.DisposeAsync();
			await _episodes.DisposeAsync();
		}

		public override Task<Season> Get(string slug)
		{
			Match match = Regex.Match(slug, @"(?<show>.*)-s(?<season>\d*)");
			
			if (!match.Success)
				throw new ArgumentException("Invalid season slug. Format: {showSlug}-s{seasonNumber}");
			return Get(match.Groups["show"].Value, int.Parse(match.Groups["season"].Value));
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
			
			try
			{
				await _database.SaveChangesAsync();
			}
			catch (DbUpdateException ex)
			{
				_database.DiscardChanges();
				if (IsDuplicateException(ex))
					throw new DuplicatedItemException($"Trying to insert a duplicated season (slug {obj.Slug} already exists).");
				throw;
			}
			
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
		
		public async Task<ICollection<Season>> GetSeasons(int showID)
		{
			return await _database.Seasons.Where(x => x.ShowID == showID).ToListAsync();
		}

		public async Task<ICollection<Season>> GetSeasons(string showSlug)
		{
			return await _database.Seasons.Where(x => x.Show.Slug == showSlug).ToListAsync();
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
				await _episodes.DeleteRange(obj.Episodes);
		}
	}
}